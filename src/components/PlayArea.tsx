import { useRef } from 'react'
import { Move, moveName, moveNameWithArticle } from '../game/moves'
import { SEAT_NAMES } from '../game/players'
import { PlayingCard } from './PlayingCard'
import { fitStep, useWidth } from './CardFan'
import { useMediaQuery } from '../hooks/useMediaQuery'

interface Props {
  currentTrick: Move | null
  lastPlayedBy: number | null
  currentPlayer: number
  isPlayerTurn: boolean
  isOpeningPlay: boolean
  playerHasPassed: boolean
}

export function PlayArea({ currentTrick, lastPlayedBy, currentPlayer, isPlayerTurn, isOpeningPlay, playerHasPassed }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useWidth(ref)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  if (!currentTrick) {
    const lead = isPlayerTurn
      ? isOpeningPlay
        ? 'Your lead — your first play must include 3♠'
        : 'Your lead — play any combination'
      : `${SEAT_NAMES[currentPlayer]} is leading…`
    return (
      <div ref={ref} className="flex-1 min-h-[160px] flex flex-col items-center justify-center gap-3.5 px-4 py-4 text-center">
        <p className="text-sm text-muted">{lead}</p>
      </div>
    )
  }

  const n = currentTrick.cards.length
  const cardW = isDesktop ? 88 : 64
  const step = fitStep(n, cardW, width, isDesktop ? 96 : 72, isDesktop ? 26 : 22)
  const who = lastPlayedBy !== null ? SEAT_NAMES[lastPlayedBy] : ''
  const isSingle2 = currentTrick.type === 'single' && currentTrick.cards[0].rank === '2'

  let hint = ''
  if (isPlayerTurn) {
    if (playerHasPassed) hint = 'You passed — only a bomb brings you back in.'
    else if (isSingle2) hint = 'Beat it with a higher 2 or a bomb, or pass.'
    else hint = `Beat it with a higher ${moveName(currentTrick.type, n)}, or pass.`
  }

  return (
    <div ref={ref} className="flex-1 min-h-[160px] flex flex-col items-center justify-center gap-3.5 px-4 py-4">
      <p className="text-[13px] text-muted">
        <span className="text-ink font-medium">{who}</span> played {moveNameWithArticle(currentTrick.type, n)}
      </p>
      <div className="flex">
        {currentTrick.cards.map((card, i) => (
          <PlayingCard key={card.id} card={card} size={isDesktop ? 'xl' : 'lg'} style={{ marginLeft: i === 0 ? 0 : step - cardW }} />
        ))}
      </div>
      {hint && <p className="text-[13px] text-muted text-center">{hint}</p>}
    </div>
  )
}
