import { Card } from './cards'
import { Move, canBombBackIn } from './moves'
import { TellDefinition, TurnContext, applyTells, ApplyResult } from './tells'

export function decideBotMove(
  hand: Card[],
  tells: TellDefinition[],
  context: TurnContext,
): ApplyResult {
  return applyTells(tells, hand, context)
}

/**
 * Whether a seat sits out the current play. Passing locks a player out for the
 * rest of the round, unless a single 2 is on the table and they hold a bomb —
 * then they get one chance per trick to bomb back in (declinedThisTrick records
 * who has already had, and passed on, that chance).
 */
function isOutOfPlay(
  seat: number,
  hands: Card[][],
  passedThisRound: number[],
  currentTrick: Move | null,
  declinedThisTrick: number[],
): boolean {
  if (hands[seat].length === 0) return true
  if (!passedThisRound.includes(seat)) return false
  return declinedThisTrick.includes(seat) || !canBombBackIn(hands[seat], currentTrick)
}

export function getNextActivePlayer(
  from: number,
  hands: Card[][],
  passedThisRound: number[],
  currentTrick: Move | null,
  declinedThisTrick: number[],
): number {
  for (let offset = 1; offset <= 4; offset++) {
    const candidate = (from + offset) % 4
    if (!isOutOfPlay(candidate, hands, passedThisRound, currentTrick, declinedThisTrick)) {
      return candidate
    }
  }
  return -1 // all have passed or are out
}

export function isRoundOver(
  lastPlayedBy: number,
  hands: Card[][],
  passedThisRound: number[],
  currentTrick: Move | null,
  declinedThisTrick: number[],
): boolean {
  return [0, 1, 2, 3].every(
    i => i === lastPlayedBy || isOutOfPlay(i, hands, passedThisRound, currentTrick, declinedThisTrick),
  )
}

export function findLeaderAfterWin(
  winner: number,
  hands: Card[][],
): number {
  // If winner has no cards left, find next player with cards
  if (hands[winner].length === 0) {
    for (let offset = 1; offset <= 4; offset++) {
      const candidate = (winner + offset) % 4
      if (hands[candidate].length > 0) return candidate
    }
    return -1
  }
  return winner
}

export function buildShareText(
  puzzleNumber: number,
  puzzleDate: string,
  position: number,
  elapsedMs: number,
  moveCount: number,
  hintPenaltyMs: number,
): string {
  const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49', '']
  const medal = medals[position - 1] ?? ''
  const posLabel = ['1st', '2nd', '3rd', '4th'][position - 1] ?? `${position}th`

  const totalMs = elapsedMs + hintPenaltyMs
  const totalSec = Math.floor(totalMs / 1000)
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`
  const penaltyStr = hintPenaltyMs > 0
    ? ` (+${Math.floor(hintPenaltyMs / 1000 / 60)}:${String(Math.floor(hintPenaltyMs / 1000) % 60).padStart(2, '0')} hint)`
    : ''

  const url = `${window.location.origin}?d=${puzzleDate}`

  return [
    `Tien Len Daily #${puzzleNumber} \uD83C\uDCCF`,
    `Finished: ${posLabel} ${medal}`,
    `Moves: ${moveCount}`,
    `Time: ${timeStr}${penaltyStr}`,
    url,
  ].join('\n')
}

export type { Move }
