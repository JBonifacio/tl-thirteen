import { LogEntry } from '../store/gameStore'
import { isRedSuit } from '../game/cards'

interface Props {
  log: LogEntry[]
}

const SEAT_NAMES = ['You', 'Lan', 'Minh', 'Tuấn']

export function RecentPlays({ log }: Props) {
  if (log.length === 0) return null

  return (
    <div className="bg-green-900/40 border border-green-800 rounded-xl px-3 py-2 flex flex-col gap-1.5">
      <span className="text-gray-500 text-[10px] uppercase tracking-wide font-semibold">Recent plays</span>
      {log.map((entry, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 text-sm transition-opacity ${i === 0 ? 'opacity-100' : 'opacity-50'}`}
        >
          <span className={`font-semibold w-10 flex-shrink-0 ${entry.seat === 0 ? 'text-yellow-300' : 'text-gray-300'}`}>
            {SEAT_NAMES[entry.seat]}
          </span>
          {entry.move === null ? (
            <span className="text-gray-500 italic">passed</span>
          ) : (
            <span className="flex gap-0.5 flex-wrap">
              {entry.move.cards.map(card => (
                <span
                  key={card.id}
                  className={`font-mono font-medium ${isRedSuit(card.suit) ? 'text-red-400' : 'text-white'}`}
                >
                  {card.rank}{card.suit}
                </span>
              ))}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
