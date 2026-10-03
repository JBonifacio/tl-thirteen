import { Card, RANK_INDEX, compareCards, cardValue } from './cards'
import { SEAT_NAMES } from './players'

export type MoveType =
  | 'single'
  | 'pair'
  | 'triple'
  | 'four_of_a_kind'
  | 'sequence'
  | 'sequence_of_pairs'

export interface Move {
  type: MoveType
  cards: Card[]
}

// ── helpers ──────────────────────────────────────────────────────────────────

function countByRank(cards: Card[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const c of cards) counts[c.rank] = (counts[c.rank] ?? 0) + 1
  return counts
}

function highCard(cards: Card[]): Card {
  return cards.reduce((best, c) => (cardValue(c) > cardValue(best) ? c : best))
}

// ── classification ────────────────────────────────────────────────────────────

export function classifyMove(cards: Card[]): MoveType | null {
  const n = cards.length
  if (n === 0) return null

  if (n === 1) return 'single'

  const counts = countByRank(cards)
  const ranks = Object.keys(counts)

  // All same rank
  if (ranks.length === 1) {
    if (n === 2) return 'pair'
    if (n === 3) return 'triple'
    if (n === 4) return 'four_of_a_kind'
    return null
  }

  // No 2s allowed in sequences
  if (cards.some(c => c.rank === '2')) return null

  const rankIndices = ranks.map(r => RANK_INDEX[r as keyof typeof RANK_INDEX]).sort((a, b) => a - b)

  // Sequence: all different ranks, consecutive
  if (n >= 3 && ranks.length === n) {
    const isConsecutive = rankIndices.every((ri, i) => i === 0 || ri === rankIndices[i - 1] + 1)
    if (isConsecutive) return 'sequence'
  }

  // Sequence of pairs: even count, each rank appears exactly twice, consecutive ranks, >= 3 pairs
  if (n >= 6 && n % 2 === 0) {
    const pairCount = n / 2
    const allPairs = Object.values(counts).every(v => v === 2)
    const isConsecutive = rankIndices.every((ri, i) => i === 0 || ri === rankIndices[i - 1] + 1)
    if (allPairs && isConsecutive && pairCount >= 3) return 'sequence_of_pairs'
  }

  return null
}

// ── comparison ────────────────────────────────────────────────────────────────

export function beatsMove(challenger: Move, current: Move): boolean {
  // Bombs beat a single 2
  if (current.type === 'single' && current.cards[0].rank === '2') {
    if (challenger.type === 'four_of_a_kind') return true
    if (challenger.type === 'sequence_of_pairs') return true
    // Higher single also beats single 2
    if (challenger.type === 'single') return compareCards(challenger.cards[0], current.cards[0]) > 0
    return false
  }

  if (challenger.type !== current.type) return false
  if (challenger.cards.length !== current.cards.length) return false

  return cardValue(highCard(challenger.cards)) > cardValue(highCard(current.cards))
}

export function isBomb(type: MoveType): boolean {
  return type === 'four_of_a_kind' || type === 'sequence_of_pairs'
}

export function isValidPlay(cards: Card[], currentTrick: Move | null): MoveType | null {
  const type = classifyMove(cards)
  if (!type) return null
  if (!currentTrick) {
    // Bombs can only be played against a single 2, never as a lead
    if (isBomb(type)) return null
    return type
  }
  const move: Move = { type, cards }
  if (!beatsMove(move, currentTrick)) return null
  return type
}

// ── labels ────────────────────────────────────────────────────────────────────

/** Short name for a combination, e.g. "pair", "5-card straight", "four of a kind". */
export function moveName(type: MoveType, cardCount: number): string {
  switch (type) {
    case 'single': return 'single'
    case 'pair': return 'pair'
    case 'triple': return 'triple'
    case 'four_of_a_kind': return 'four of a kind'
    case 'sequence': return `${cardCount}-card straight`
    case 'sequence_of_pairs': return `${cardCount / 2}-pair sequence`
  }
}

/** "a pair", "four of a kind" — for sentences like "Minh played a pair". */
export function moveNameWithArticle(type: MoveType, cardCount: number): string {
  return type === 'four_of_a_kind' ? moveName(type, cardCount) : `a ${moveName(type, cardCount)}`
}

/**
 * A player who passed is out until the round ends — except that when the play
 * on the table is a single 2, they may come back in with a bomb.
 */
export function canBombBackIn(hand: Card[], currentTrick: Move | null): boolean {
  if (!currentTrick || currentTrick.type !== 'single' || currentTrick.cards[0].rank !== '2') return false
  return generateAllValidMoves(hand, currentTrick).some(m => isBomb(m.type))
}

// ── invalid-play feedback ─────────────────────────────────────────────────────

const cardText = (c: Card) => `${c.rank}${c.suit}`

interface ExplainContext {
  mustInclude3S: boolean // the game's opening play
  lastPlayedBy: number // seat that put the current trick down
  hasPassed: boolean // passed this round: only a bomb on a single 2 brings them back
}

/**
 * Why `cards` can't be played on `currentTrick`, as one short sentence — or null
 * when the play is legal. Mirrors the guards in `playerPlay` (gameStore.ts).
 */
export function explainInvalidPlay(cards: Card[], currentTrick: Move | null, ctx: ExplainContext): string | null {
  if (cards.length === 0) return null
  if (ctx.mustInclude3S && !cards.some(c => c.id === '3\u2660')) return 'Your first play must include 3♠.'

  const type = classifyMove(cards)
  if (!type) return "That's not a valid combination."

  const onSingle2 = !!currentTrick && currentTrick.type === 'single' && currentTrick.cards[0].rank === '2'
  if (ctx.hasPassed && !(onSingle2 && isBomb(type))) return 'You passed — only a bomb brings you back.'

  if (!currentTrick) return isBomb(type) ? 'Bombs can only be played on a single 2.' : null
  if (beatsMove({ type, cards }, currentTrick)) return null

  const who = SEAT_NAMES[ctx.lastPlayedBy]
  const n = currentTrick.cards.length
  if (onSingle2 && type !== 'single') return `${who} played a 2 — beat it with a higher 2 or a bomb.`
  if (isBomb(type) && !onSingle2 && !isBomb(currentTrick.type)) return 'Bombs only beat a single 2.'
  if (type !== currentTrick.type || cards.length !== n) {
    const name = moveNameWithArticle(currentTrick.type, n)
    const isLong = currentTrick.type === 'sequence' || currentTrick.type === 'sequence_of_pairs'
    return `${who} played ${name} — ${isLong ? 'match it' : `play ${name}`} to beat it.`
  }

  // Right shape, too low. Short combos list their cards; long ones name only the top card.
  const sorted = [...currentTrick.cards].sort(compareCards)
  if (type === 'sequence' || type === 'sequence_of_pairs') {
    const shape = type === 'sequence' ? 'straight' : 'sequence'
    return `Your ${shape} needs a higher top card than ${cardText(sorted[sorted.length - 1])}.`
  }
  return `Your ${moveName(type, n)} has to beat ${sorted.map(cardText).join(' ')}.`
}

// ── generation (for bot AI) ───────────────────────────────────────────────────

function getSingles(hand: Card[], currentTrick: Move | null): Move[] {
  const moves: Move[] = []
  for (const card of hand) {
    const move: Move = { type: 'single', cards: [card] }
    if (!currentTrick || beatsMove(move, currentTrick)) moves.push(move)
  }
  return moves
}

function getPairs(hand: Card[], currentTrick: Move | null): Move[] {
  const byRank = new Map<string, Card[]>()
  for (const c of hand) {
    if (!byRank.has(c.rank)) byRank.set(c.rank, [])
    byRank.get(c.rank)!.push(c)
  }
  const moves: Move[] = []
  for (const cards of byRank.values()) {
    if (cards.length < 2) continue
    const sorted = [...cards].sort(compareCards)
    // lowest pair
    const low: Move = { type: 'pair', cards: [sorted[0], sorted[1]] }
    if (!currentTrick || beatsMove(low, currentTrick)) moves.push(low)
    // highest pair (if different from lowest)
    if (cards.length >= 2) {
      const high: Move = { type: 'pair', cards: [sorted[sorted.length - 2], sorted[sorted.length - 1]] }
      if (high.cards[0].id !== low.cards[0].id && (!currentTrick || beatsMove(high, currentTrick))) {
        moves.push(high)
      }
    }
  }
  return moves
}

function getTriples(hand: Card[], currentTrick: Move | null): Move[] {
  const byRank = new Map<string, Card[]>()
  for (const c of hand) {
    if (!byRank.has(c.rank)) byRank.set(c.rank, [])
    byRank.get(c.rank)!.push(c)
  }
  const moves: Move[] = []
  for (const cards of byRank.values()) {
    if (cards.length < 3) continue
    const sorted = [...cards].sort(compareCards)
    const move: Move = { type: 'triple', cards: sorted.slice(0, 3) }
    if (!currentTrick || beatsMove(move, currentTrick)) moves.push(move)
  }
  return moves
}

function getFourOfAKind(hand: Card[], currentTrick: Move | null): Move[] {
  const byRank = new Map<string, Card[]>()
  for (const c of hand) {
    if (!byRank.has(c.rank)) byRank.set(c.rank, [])
    byRank.get(c.rank)!.push(c)
  }
  const moves: Move[] = []
  for (const cards of byRank.values()) {
    if (cards.length < 4) continue
    const move: Move = { type: 'four_of_a_kind', cards: [...cards].sort(compareCards).slice(0, 4) }
    if (!currentTrick || beatsMove(move, currentTrick)) moves.push(move)
  }
  return moves
}

function getSequences(hand: Card[], targetLen: number | null, currentTrick: Move | null): Move[] {
  const nonTwos = hand.filter(c => c.rank !== '2')
  const byRank = new Map<number, Card[]>()
  for (const c of nonTwos) {
    const ri = RANK_INDEX[c.rank]
    if (!byRank.has(ri)) byRank.set(ri, [])
    byRank.get(ri)!.push(c)
  }
  const rankIndices = [...byRank.keys()].sort((a, b) => a - b)
  const moves: Move[] = []

  const minLen = targetLen ?? 3
  const maxLen = targetLen ?? rankIndices.length

  for (let start = 0; start < rankIndices.length; start++) {
    for (let len = minLen; len <= maxLen && start + len <= rankIndices.length; len++) {
      const slice = rankIndices.slice(start, start + len)
      const isConsec = slice.every((ri, i) => i === 0 || ri === slice[i - 1] + 1)
      if (!isConsec) break

      const sorted = [...byRank.get(slice[slice.length - 1])!].sort(compareCards)
      const lowestEnd = sorted[0]
      const cards = slice.map(ri => {
        const cs = [...byRank.get(ri)!].sort(compareCards)
        return cs[0]
      })
      const move: Move = { type: 'sequence', cards }
      const dummy: Move = { type: 'sequence', cards: [...cards.slice(0, -1), lowestEnd] }
      void dummy
      if (!currentTrick || beatsMove(move, currentTrick)) moves.push(move)

      // Also try highest card per rank (to have a beater variant)
      const highCards = slice.map(ri => {
        const cs = [...byRank.get(ri)!].sort(compareCards)
        return cs[cs.length - 1]
      })
      if (highCards.some((c, i) => c.id !== cards[i].id)) {
        const highMove: Move = { type: 'sequence', cards: highCards }
        if (!currentTrick || beatsMove(highMove, currentTrick)) moves.push(highMove)
      }
    }
  }
  return moves
}

function getSequenceOfPairs(hand: Card[], pairCount: number | null, currentTrick: Move | null): Move[] {
  const nonTwos = hand.filter(c => c.rank !== '2')
  const byRank = new Map<number, Card[]>()
  for (const c of nonTwos) {
    const ri = RANK_INDEX[c.rank]
    if (!byRank.has(ri)) byRank.set(ri, [])
    byRank.get(ri)!.push(c)
  }
  // Only ranks with >= 2 cards
  const pairRanks = [...byRank.entries()]
    .filter(([, cards]) => cards.length >= 2)
    .map(([ri]) => ri)
    .sort((a, b) => a - b)

  const moves: Move[] = []
  const minPairs = pairCount ?? 3
  const maxPairs = pairCount ?? pairRanks.length

  for (let start = 0; start < pairRanks.length; start++) {
    for (let len = minPairs; len <= maxPairs && start + len <= pairRanks.length; len++) {
      const slice = pairRanks.slice(start, start + len)
      const isConsec = slice.every((ri, i) => i === 0 || ri === slice[i - 1] + 1)
      if (!isConsec) break

      const cards: Card[] = []
      for (const ri of slice) {
        const sorted = [...byRank.get(ri)!].sort(compareCards)
        cards.push(sorted[0], sorted[1])
      }
      const move: Move = { type: 'sequence_of_pairs', cards }
      if (!currentTrick || beatsMove(move, currentTrick)) moves.push(move)
    }
  }
  return moves
}

export function generateAllValidMoves(hand: Card[], currentTrick: Move | null): Move[] {
  if (!currentTrick) {
    // Leading: bombs (four_of_a_kind, sequence_of_pairs) are excluded —
    // they can only be played in response to a single 2.
    return [
      ...getSingles(hand, null),
      ...getPairs(hand, null),
      ...getTriples(hand, null),
      ...getSequences(hand, null, null),
    ]
  }

  // Against a single 2: singles that beat it + bombs
  if (currentTrick.type === 'single' && currentTrick.cards[0].rank === '2') {
    return [
      ...getSingles(hand, currentTrick),
      ...getFourOfAKind(hand, currentTrick),
      ...getSequenceOfPairs(hand, null, currentTrick),
    ]
  }

  // Same type, same count
  switch (currentTrick.type) {
    case 'single':
      return getSingles(hand, currentTrick)
    case 'pair':
      return getPairs(hand, currentTrick)
    case 'triple':
      return getTriples(hand, currentTrick)
    case 'four_of_a_kind':
      return getFourOfAKind(hand, currentTrick)
    case 'sequence':
      return getSequences(hand, currentTrick.cards.length, currentTrick)
    case 'sequence_of_pairs':
      return getSequenceOfPairs(hand, currentTrick.cards.length / 2, currentTrick)
  }
}
