import { useState } from 'react'
import { Card, compareCards } from '../game/cards'
import { Move, isValidPlay } from '../game/moves'
import { CardComponent } from './CardComponent'

interface Props {
  hand: Card[]
  isActive: boolean
  currentTrick: Move | null
  onPlay: (cards: Card[]) => void
  onPass: () => void
}

export function Hand({ hand, isActive, currentTrick, onPlay, onPass }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const sorted = [...hand].sort(compareCards)
  const selectedCards = sorted.filter(c => selected.has(c.id))

  const playType = selectedCards.length > 0 ? isValidPlay(selectedCards, currentTrick) : null
  const canPlay = !!playType
  const canPass = isActive && !!currentTrick

  function toggleCard(card: Card) {
    if (!isActive) return
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

  return (
    <div className="flex flex-col gap-3">
      {/* Card row */}
      <div className="flex gap-1 flex-wrap justify-center">
        {sorted.map(card => (
          <CardComponent
            key={card.id}
            card={card}
            selected={selected.has(card.id)}
            onClick={() => toggleCard(card)}
          />
        ))}
      </div>

      {/* Action buttons */}
      {isActive && (
        <div className="flex gap-3 justify-center items-center">
          <button
            onClick={handlePlay}
            disabled={!canPlay}
            className={`
              px-6 py-2 rounded-lg font-semibold text-sm transition-colors
              ${canPlay
                ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
            `}
          >
            Play {selectedCards.length > 0 ? `(${selectedCards.length})` : ''}
          </button>
          <button
            onClick={handlePass}
            disabled={!canPass}
            className={`
              px-6 py-2 rounded-lg font-semibold text-sm transition-colors
              ${canPass
                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
            `}
          >
            Pass
          </button>
        </div>
      )}

      {!isActive && hand.length > 0 && (
        <div className="text-center text-gray-500 text-sm italic animate-pulse">
          Waiting for other players…
        </div>
      )}
    </div>
  )
}
