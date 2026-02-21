import { Card } from '../game/cards'
import { CardComponent } from './CardComponent'
import { TellDefinition } from '../game/tells'

interface Props {
  seat: number // 1-3
  hand: Card[]
  revealedCardIds: Set<string>
  isActive: boolean
  isFinished: boolean
  finishPosition: number | null
  tells: TellDefinition[]
  confirmedTells: Set<string>
  onRevealHint: () => void
  hintAvailable: boolean
}

const BOT_NAMES = ['Lan', 'Minh', 'Tuấn']

export function BotPanel({
  seat,
  hand,
  revealedCardIds,
  isActive,
  isFinished,
  finishPosition,
  tells,
  confirmedTells,
  onRevealHint,
  hintAvailable,
}: Props) {
  const name = BOT_NAMES[seat - 1]
  const confirmed = tells.filter(t => confirmedTells.has(t.id))
  const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49', '']

  const revealedCards = hand.filter(c => revealedCardIds.has(c.id))
  const blindCount = hand.length - revealedCards.length

  return (
    <div
      className={`
        rounded-xl p-3 flex flex-col gap-2 min-w-[160px]
        ${isActive ? 'ring-2 ring-yellow-400 bg-green-800' : 'bg-green-900'}
        transition-all duration-300
      `}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white text-sm">{name}</span>
        {isActive && <span className="text-yellow-300 text-xs animate-pulse">●</span>}
        {isFinished && finishPosition !== null && (
          <span className="text-sm">{medals[finishPosition - 1]}</span>
        )}
      </div>

      {/* Card row: revealed face-up first, then blind face-down */}
      <div className="flex gap-0.5 flex-wrap items-end">
        {revealedCards.map(card => (
          <CardComponent key={card.id} card={card} small />
        ))}
        {revealedCards.length > 0 && blindCount > 0 && (
          <div className="w-px h-8 bg-green-600 mx-0.5 self-center" />
        )}
        {Array.from({ length: blindCount }).map((_, i) => (
          <CardComponent key={`blind-${i}`} card={{ rank: '3', suit: '\u2660', id: '' }} faceDown small />
        ))}
        {hand.length === 0 && <span className="text-gray-400 text-xs italic">No cards</span>}
      </div>

      <div className="text-gray-400 text-xs">
        {hand.length} card{hand.length !== 1 ? 's' : ''}
        {revealedCards.length > 0 && (
          <span className="text-amber-400 ml-1">· {revealedCards.length} shown</span>
        )}
      </div>

      {/* Confirmed tells */}
      {confirmed.length > 0 && (
        <div className="border-t border-green-700 pt-2 space-y-1">
          {confirmed.map(t => (
            <div key={t.id} className="flex items-start gap-1">
              <span className="text-yellow-400 text-xs mt-0.5">✓</span>
              <span className="text-yellow-200 text-xs">{t.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hint button */}
      {hintAvailable && !isFinished && (
        <button
          onClick={onRevealHint}
          className="mt-1 text-xs bg-amber-700 hover:bg-amber-600 text-amber-100 rounded px-2 py-0.5 transition-colors"
        >
          Reveal tell (+1:00)
        </button>
      )}
    </div>
  )
}
