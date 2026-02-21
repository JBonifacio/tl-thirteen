import { Card, RANK_INDEX, compareCards } from './cards'
import { Move, generateAllValidMoves } from './moves'
import { makeRng, Hand } from './deal'

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
  /** If provided, tell is only eligible for assignment when this returns true for the bot's hand. */
  isApplicable?: (hand: Hand) => boolean
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
    isApplicable: (hand) => Object.values(countByRank(hand)).some(n => n >= 2),
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
    isApplicable: (hand) => Object.values(countByRank(hand)).some(n => n >= 3),
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
    isApplicable: (hand) => getStraightCardIds(hand).size > 0,
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
    isApplicable: (hand) => hand.some(c => c.rank === '2'),
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
  {
    id: 'MARKED_CARDS',
    category: 'sequencing',
    label: 'Marked cards',
    description: 'You can identify 1–3 of this bot\'s cards from marks on the back.',
    priority: 99,
    confirmThreshold: 0, // always confirmed — the marks are visible
    filter: (candidates) => candidates, // no behavioural constraint, purely visual
  },
]

// ── Default Strategy ──────────────────────────────────────────────────────────

// When leading, prefer shedding combinations over singles. Lower number = higher priority.
const LEAD_PRIORITY: Record<string, number> = {
  sequence_of_pairs: 1,
  sequence: 2,
  triple: 3,
  pair: 4,
  single: 5,
  four_of_a_kind: 6, // hoard bombs; only lead one if nothing else remains
}

function moveHighCard(move: Move): Card {
  return move.cards.reduce((best, c) => (compareCards(c, best) > 0 ? c : best))
}

/** True if this card is naturally part of a pair, triple, or straight in the hand.
 *  Used to soft-prefer playing isolated singles over breaking combos. */
function isComboCard(card: Card, hand: Card[]): boolean {
  if ((countByRank(hand)[card.rank] ?? 0) >= 2) return true
  if (getStraightCardIds(hand).has(card.id)) return true
  return false
}

/**
 * Card value tier for pass-decision logic.
 * 1=cheap (3–8), 2=mid (9–Q), 3=expensive (K,A), 4=premium (2)
 */
function cardTier(card: Card): number {
  if (card.rank === '2') return 4
  if (card.rank === 'K' || card.rank === 'A') return 3
  if (['9', '10', 'J', 'Q'].includes(card.rank)) return 2
  return 1
}

function moveTier(move: Move): number {
  return Math.max(...move.cards.map(cardTier))
}

/** True if the hand has at least one card cheaper than the given tier. */
function handHasCheaperCard(hand: Card[], tier: number): boolean {
  return hand.some(c => cardTier(c) < tier)
}

function byLowestHighCard(a: Move, b: Move): number {
  return compareCards(moveHighCard(a), moveHighCard(b))
}

// Returns null to signal a strategic pass.
function selectBestMove(candidates: Move[], hand: Card[], context: TurnContext): Move | null {
  const isLeading = !context.currentTrick
  const isEndgame = hand.length <= 4

  // ── Leading ────────────────────────────────────────────────────────────────
  if (isLeading) {
    // Endgame: shed as many cards as possible per turn, don't care about type
    if (isEndgame) {
      return [...candidates].sort((a, b) => {
        if (b.cards.length !== a.cards.length) return b.cards.length - a.cards.length
        return byLowestHighCard(a, b)
      })[0]
    }

    // Normal: prefer combinations over singles; avoid leading 2s or bombs if anything else available
    const nonTwo = candidates.filter(m => !m.cards.some(c => c.rank === '2'))
    const pool = nonTwo.length > 0 ? nonTwo : candidates

    return [...pool].sort((a, b) => {
      const pa = LEAD_PRIORITY[a.type] ?? 5
      const pb = LEAD_PRIORITY[b.type] ?? 5
      if (pa !== pb) return pa - pb
      return byLowestHighCard(a, b)
    })[0]
  }

  // ── Following ──────────────────────────────────────────────────────────────
  const trick = context.currentTrick!

  // Rule: Contesting a single 2 — prefer bombs; only spend a higher 2 in endgame (≤5 cards)
  if (trick.type === 'single' && trick.cards[0].rank === '2') {
    const bombs = candidates.filter(
      m => m.type === 'four_of_a_kind' || m.type === 'sequence_of_pairs',
    )
    if (bombs.length > 0) {
      return [...bombs].sort(byLowestHighCard)[0]
    }
    // No bomb available — only use a higher 2 if in endgame
    if (hand.length > 5) return null // pass
    return [...candidates].sort(byLowestHighCard)[0]
  }

  // Prefer not spending 2s if a cheaper beater exists
  const nonTwo = candidates.filter(m => !m.cards.some(c => c.rank === '2'))
  const pool = nonTwo.length > 0 ? nonTwo : candidates

  // Rule: Pass if all remaining beaters are expensive (K/A) or premium (2) and
  // the hand still has cheaper cards to shed — don't burn good cards on ordinary tricks.
  if (!isEndgame) {
    const minTier = Math.min(...pool.map(moveTier))
    if (minTier >= 3 && handHasCheaperCard(hand, minTier)) {
      return null // pass — cost too high
    }
  }

  // For singles: soft-prefer isolated cards over cards that are part of a natural combo,
  // preserving pairs/triples/straights without a hard tell enforcing it.
  if (trick.type === 'single') {
    const isolated = pool.filter(m => !isComboCard(m.cards[0], hand))
    const ordered = isolated.length > 0 ? isolated : pool
    return [...ordered].sort(byLowestHighCard)[0]
  }

  // For all other following types: play the lowest valid beater
  return [...pool].sort(byLowestHighCard)[0]
}

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

  // selectBestMove returns null when a strategic pass is warranted even with legal moves
  const chosen = selectBestMove(candidates, hand, context)
  return { chosen, triggeredIds }
}

// ── Assignment ────────────────────────────────────────────────────────────────

export function assignBotTells(dateString: string, hands: [Hand, Hand, Hand, Hand]): [TellDefinition[], TellDefinition[], TellDefinition[]] {
  const rng = makeRng(dateString, 'tells')

  function pickTellsForBot(hand: Hand): TellDefinition[] {
    const eligible = TELL_REGISTRY.filter(t => !t.isApplicable || t.isApplicable(hand))
    // Each bot gets 2–4 tells, chosen randomly from the seeded RNG
    const count = 2 + Math.floor(rng() * 3) // 2, 3, or 4
    const tells: TellDefinition[] = []
    for (let i = 0; i < count; i++) {
      tells.push(eligible[Math.floor(rng() * eligible.length)])
    }
    return tells
  }

  const botA = pickTellsForBot(hands[1])
  const botB = pickTellsForBot(hands[2])
  const botC = pickTellsForBot(hands[3])

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
