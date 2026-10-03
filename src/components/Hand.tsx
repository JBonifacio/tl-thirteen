import { useEffect, useRef, useState } from 'react'
import { Card, compareCards } from '../game/cards'
import { Move, isValidPlay, isBomb, moveName } from '../game/moves'
import { PlayingCard } from './PlayingCard'
import { fitStep, useWidth } from './CardFan'
import { Button } from './ui/Button'

interface Props {
  hand: Card[]
  isActive: boolean
  currentTrick: Move | null
  onPlay: (cards: Card[]) => void
  onPass: () => void
  bombsOnly?: boolean // player passed this round: only a bomb (on a single 2) brings them back
  waitingFor: string | null // name of the player whose turn it is, when it isn't ours
}

const CARD_WIDTH = 48

export function Hand({ hand, isActive, currentTrick, onPlay, onPass, bombsOnly = false, waitingFor }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const fanRef = useRef<HTMLDivElement>(null)
  const width = useWidth(fanRef)

  const sorted = [...hand].sort(compareCards)
  const selectedCards = sorted.filter(c => selected.has(c.id))
  const step = fitStep(sorted.length, CARD_WIDTH, width, 28, 16)

  const playType = selectedCards.length > 0 ? isValidPlay(selectedCards, currentTrick) : null
  const canPlay = isActive && !!playType && (!bombsOnly || isBomb(playType))
  const canPass = isActive && !!currentTrick

  // Drop any selection once it's no longer our turn
  useEffect(() => {
    if (!isActive) setSelected(new Set())
  }, [isActive])

  function toggleCard(card: Card) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(card.id)) next.delete(card.id)
      else next.add(card.id)
      return next
    })
  }

  function handlePlay() {
    if (!canPlay) return
    onPlay(selectedCards)
    setSelected(new Set())
  }

  function handlePass() {
    if (!canPass) return
    setSelected(new Set())
    onPass()
  }

  const playLabel = selectedCards.length === 0
    ? 'Select cards'
    : canPlay && playType
      ? `Play ${moveName(playType, selectedCards.length)}`
      : 'Play'

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between min-h-[26px]">
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-accent/10 text-accent-text text-[13px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-text" />
            {bombsOnly ? 'Bomb back in?' : 'Your turn'}
          </span>
        ) : (
          <span className="text-[13px] text-muted">{waitingFor ? `Waiting for ${waitingFor}…` : ''}</span>
        )}
        {isActive && <span className="text-[13px] text-muted">{selected.size} selected</span>}
      </div>

      <div ref={fanRef} className="flex justify-center pt-3.5">
        {sorted.map((card, i) => (
          <PlayingCard
            key={card.id}
            card={card}
            size="md"
            selected={selected.has(card.id)}
            onClick={isActive ? () => toggleCard(card) : undefined}
            style={{ marginLeft: i === 0 ? 0 : step - CARD_WIDTH }}
          />
        ))}
      </div>

      <div className="grid grid-cols-[1fr_2fr] gap-2">
        <Button variant="secondary" onClick={handlePass} disabled={!canPass}>
          Pass
        </Button>
        <Button onClick={handlePlay} disabled={!canPlay}>
          {playLabel}
        </Button>
      </div>
    </div>
  )
}
