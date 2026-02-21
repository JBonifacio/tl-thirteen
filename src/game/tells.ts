import { Card, RANK_INDEX, compareCards } from './cards'
import { Move, generateAllValidMoves } from './moves'
import { makeRng } from './deal'

// ── Types ─────────────────────────────────────────────────────────────────────

export type TellCategory = 'preservation' | 'aggression' | 'sequencing' | 'endgame'

export interface TurnContext {
  currentTrick: Move | null
}

export type MoveFilter = (
  candidates: Move[],
  allValid: Move[],
  hand: Card[],
  context: TurnContext,
) => Move[]

export interface TellDefinition {
  id: string
  category: TellCategory
  label: string
  description: string
  priority: number
  confirmThreshold: number
  filter: MoveFilter
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countByRank(cards: Card[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const c of cards) counts[c.rank] = (counts[c.rank] ?? 0) + 1
  return counts
}

function getStraightCardIds(hand: Card[]): Set<string> {
  const nonTwos = hand.filter(c => c.rank !== '2')
  const byRank = new Map<number, Card[]>()
  for (const c of nonTwos) {
    const ri = RANK_INDEX[c.rank]
    if (!byRank.has(ri)) byRank.set(ri, [])
    byRank.get(ri)!.push(c)
  }
  const rankIndices = [...byRank.keys()].sort((a, b) => a - b)
  const inStraight = new Set<string>()

  let runStart = 0
  for (let i = 1; i <= rankIndices.length; i++) {
    const ended = i === rankIndices.length || rankIndices[i] !== rankIndices[i - 1] + 1
    if (ended) {
      const runLen = i - runStart
      if (runLen >= 3) {
        for (let j = runStart; j < i; j++) {
          byRank.get(rankIndices[j])!.forEach(c => inStraight.add(c.id))
        }
      }
      runStart = i
    }
  }
  return inStraight
}

// ── Tell Registry ─────────────────────────────────────────────────────────────
// To add a new tell: append a TellDefinition object. Nothing else changes.

export const TELL_REGISTRY: TellDefinition[] = [
  {
    id: 'PRESERVE_PAIRS',
    category: 'preservation',
    label: 'Never breaks a pair',
    description: 'Will not use one card from a pair as a single play.',
    priority: 20,
    confirmThreshold: 2,
    filter: (candidates, _allValid, hand) => {
      const counts = countByRank(hand)
      return candidates.filter(move => {
        if (move.type !== 'single') return true
        return counts[move.cards[0].rank] !== 2
      })
    },
  },
  {
    id: 'PRESERVE_TRIPLES',
    category: 'preservation',
    label: 'Never breaks three-of-a-kind',
    description: 'Will not play singles or pairs from a triple.',
    priority: 10,
    confirmThreshold: 2,
    filter: (candidates, _allValid, hand) => {
      const counts = countByRank(hand)
      return candidates.filter(move => {
        if (move.type === 'triple' || move.type === 'four_of_a_kind') return true
        for (const card of move.cards) {
          const inHand = counts[card.rank] ?? 0
          const usedInMove = move.cards.filter(c => c.rank === card.rank).length
          if (inHand >= 3 && usedInMove < inHand && usedInMove < 3) return false
        }
        return true
      })
    },
  },
  {
    id: 'PRESERVE_STRAIGHTS',
    category: 'preservation',
    label: 'Never breaks a straight',
    description: 'Will not play singles from cards that form a sequence.',
    priority: 10,
    confirmThreshold: 2,
    filter: (candidates, _allValid, hand) => {
      const inStraight = getStraightCardIds(hand)
      return candidates.filter(move => {
        if (move.type !== 'single') return true
        return !inStraight.has(move.cards[0].id)
      })
    },
  },
  {
    id: 'HOARD_TWOS',
    category: 'preservation',
    label: 'Never combines 2s',
    description: 'Only plays 2s as singles, never in combinations.',
    priority: 10,
    confirmThreshold: 2,
    filter: (candidates) => {
      return candidates.filter(move => {
        if (move.type === 'single') return true
        return !move.cards.some(c => c.rank === '2')
      })
    },
  },
  {
    id: 'ALWAYS_BEAT_SINGLE',
    category: 'aggression',
    label: 'Always contests singles',
    description: 'Must play a single if it can beat the current single.',
    priority: 50,
    confirmThreshold: 2,
    filter: (candidates, allValid, _hand, context) => {
      if (!context.currentTrick || context.currentTrick.type !== 'single') return candidates
      // Re-admit all valid singles (even if a preservation tell removed them)
      const allSingles = allValid.filter(m => m.type === 'single')
      const nonSingles = candidates.filter(m => m.type !== 'single')
      const existingIds = new Set(candidates.filter(m => m.type === 'single').map(m => m.cards[0].id))
      const newSingles = allSingles.filter(m => !existingIds.has(m.cards[0].id))
      return [...nonSingles, ...candidates.filter(m => m.type === 'single'), ...newSingles]
    },
  },
  {
    id: 'HIGH_SINGLE_BREAKER',
    category: 'aggression',
    label: 'Burns high cards as singles',
    description: 'Will break pairs to play 10s and above as singles.',
    priority: 30,
    confirmThreshold: 1,
    filter: (candidates, allValid, _hand, context) => {
      if (!context.currentTrick || context.currentTrick.type !== 'single') return candidates
      const HIGH_RANKS = new Set(['10', 'J', 'Q', 'K', 'A'])
      const existingIds = new Set(candidates.map(m => m.cards[0].id))
      const highSingles = allValid.filter(
        m => m.type === 'single' && HIGH_RANKS.has(m.cards[0].rank) && !existingIds.has(m.cards[0].id),
      )
      return [...candidates, ...highSingles]
    },
  },
  {
    id: 'REVEALED_CARDS',
    category: 'sequencing',
    label: 'Accidentally revealed cards',
    description: 'Some of this bot\'s cards are visible to you.',
    priority: 99,
    confirmThreshold: 0, // always confirmed — the cards are right there
    filter: (candidates) => candidates, // no behavioural constraint, purely visual
  },
]

// ── Application ───────────────────────────────────────────────────────────────

export interface ApplyResult {
  chosen: Move | null // null = pass
  triggeredIds: string[]
}

export function applyTells(
  tells: TellDefinition[],
  hand: Card[],
  context: TurnContext,
): ApplyResult {
  const allValid = generateAllValidMoves(hand, context.currentTrick)
  const sorted = [...tells].sort((a, b) => a.priority - b.priority)

  const triggeredIds: string[] = []
  let candidates = [...allValid]

  for (const tell of sorted) {
    const before = candidates.map(m => m.cards.map(c => c.id).join(','))
    const after = tell.filter(candidates, allValid, hand, context)
    const afterStr = after.map(m => m.cards.map(c => c.id).join(','))
    if (JSON.stringify(before) !== JSON.stringify(afterStr)) {
      triggeredIds.push(tell.id)
    }
    candidates = after
  }

  if (candidates.length === 0) return { chosen: null, triggeredIds }

  // Bot strategy: play the lowest valid move
  const sorted_candidates = [...candidates].sort((a, b) => {
    const aHigh = a.cards.reduce((best, c) => (compareCards(c, best) > 0 ? c : best))
    const bHigh = b.cards.reduce((best, c) => (compareCards(c, best) > 0 ? c : best))
    return compareCards(aHigh, bHigh)
  })

  return { chosen: sorted_candidates[0], triggeredIds }
}

// ── Assignment ────────────────────────────────────────────────────────────────

export function assignBotTells(dateString: string): [TellDefinition[], TellDefinition[], TellDefinition[]] {
  const rng = makeRng(dateString, 'tells')

  function pickTell(): TellDefinition {
    const idx = Math.floor(rng() * TELL_REGISTRY.length)
    return TELL_REGISTRY[idx]
  }

  const botA = [pickTell(), pickTell()]
  const botB = [pickTell(), pickTell()]
  const botC = [pickTell(), pickTell()]

  const alwaysBeat = TELL_REGISTRY.find(t => t.id === 'ALWAYS_BEAT_SINGLE')!
  const allAssigned = [...botA, ...botB, ...botC]
  if (!allAssigned.some(t => t.id === 'ALWAYS_BEAT_SINGLE')) {
    botA[0] = alwaysBeat
  }

  return [botA, botB, botC]
}

// ── Pool summary (for the HUD) ────────────────────────────────────────────────

export interface TellPoolEntry {
  tell: TellDefinition
  count: number // how many bots share it
}

export function getTellPool(botTells: TellDefinition[][]): TellPoolEntry[] {
  const countMap = new Map<string, { tell: TellDefinition; count: number }>()
  for (const tells of botTells) {
    const seen = new Set<string>()
    for (const tell of tells) {
      if (seen.has(tell.id)) continue
      seen.add(tell.id)
      if (!countMap.has(tell.id)) countMap.set(tell.id, { tell, count: 0 })
      countMap.get(tell.id)!.count++
    }
  }
  return [...countMap.values()]
}
