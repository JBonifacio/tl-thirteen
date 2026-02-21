export type Suit = '\u2660' | '\u2663' | '\u2666' | '\u2665'
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2'

export interface Card {
  rank: Rank
  suit: Suit
  id: string
}

export const RANKS: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
export const SUITS: Suit[] = ['\u2660', '\u2663', '\u2666', '\u2665']

export const RANK_INDEX: Record<Rank, number> = Object.fromEntries(
  RANKS.map((r, i) => [r, i]),
) as Record<Rank, number>

export const SUIT_INDEX: Record<Suit, number> = {
  '\u2660': 0,
  '\u2663': 1,
  '\u2666': 2,
  '\u2665': 3,
}

export function cardValue(card: Card): number {
  return RANK_INDEX[card.rank] * 4 + SUIT_INDEX[card.suit]
}

export function compareCards(a: Card, b: Card): number {
  return cardValue(a) - cardValue(b)
}

export function isRedSuit(suit: Suit): boolean {
  return suit === '\u2666' || suit === '\u2665'
}

export function buildDeck(): Card[] {
  const cards: Card[] = []
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      cards.push({ rank, suit, id: `${rank}${suit}` })
    }
  }
  return cards
}
