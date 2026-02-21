import { Card, buildDeck, RANK_INDEX } from './cards'

export type Hand = Card[]

// ── Mulberry32 PRNG ──────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h >>> 0
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ── Instant-win detection ─────────────────────────────────────────────────────

function hasDragon(hand: Hand): boolean {
  const ranks = new Set(hand.map(c => c.rank))
  return (['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const).every(r =>
    ranks.has(r),
  )
}

function hasFourTwos(hand: Hand): boolean {
  return hand.filter(c => c.rank === '2').length === 4
}

function anyInstantWin(hands: Hand[]): boolean {
  return hands.some(h => hasDragon(h) || hasFourTwos(h))
}

// ── Deal ──────────────────────────────────────────────────────────────────────

export interface DealResult {
  hands: [Hand, Hand, Hand, Hand]
  seedString: string
  startingPlayer: number // 0-3, whoever holds 3♠
}

export function getDailyDeal(dateString: string): DealResult {
  const THREE_SPADES_ID = '3\u2660'
  let attempt = 0

  while (true) {
    const seedStr = `${dateString}-${attempt}`
    const rng = mulberry32(hashString(seedStr))
    const shuffled = seededShuffle(buildDeck(), rng)

    const hands: [Hand, Hand, Hand, Hand] = [
      shuffled.slice(0, 13),
      shuffled.slice(13, 26),
      shuffled.slice(26, 39),
      shuffled.slice(39, 52),
    ]

    if (!anyInstantWin(hands)) {
      const startingPlayer = hands.findIndex(h => h.some(c => c.id === THREE_SPADES_ID))
      return { hands, seedString: seedStr, startingPlayer }
    }

    attempt++
  }
}

// ── Tell assignment seed (separate from deal seed) ───────────────────────────

export function makeRng(dateString: string, namespace: string): () => number {
  return mulberry32(hashString(`${namespace}-${dateString}`))
}

export { RANK_INDEX }
