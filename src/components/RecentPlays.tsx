import { LogEntry } from '../store/gameStore'
import { SEAT_NAMES } from '../game/players'
import { SUIT_COLOR } from './PlayingCard'

interface Props {
  log: LogEntry[] // most recent first
}

export function RecentPlays({ log }: Props) {
  if (log.length === 0) return null

  return (
    <div className="h-10 px-3 flex items-center gap-2.5 bg-surface border border-line rounded-xl text-[13px] whitespace-nowrap overflow-hidden">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Recent</span>
      {log.slice(0, 3).map((entry, i) => (
        <span key={i} className="flex items-center gap-2.5">
          {i > 0 && <span aria-hidden="true" className="text-card-line">/</span>}
          {entry.move === null ? (
            <span className="text-muted">{SEAT_NAMES[entry.seat]} passed</span>
          ) : (
            <span className={i === 0 ? 'text-ink' : 'text-muted'}>
              {SEAT_NAMES[entry.seat]}{' '}
              <span className="font-mono">
                {entry.move.cards.map((card, ci) => (
                  <span key={card.id} className={SUIT_COLOR[card.suit]}>
                    {ci > 0 && ' '}{card.rank}{card.suit}
                  </span>
                ))}
              </span>
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
