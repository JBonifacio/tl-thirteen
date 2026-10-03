import { LogEntry } from '../store/gameStore'
import { SEAT_NAMES } from '../game/players'
import { SUIT_COLOR } from './PlayingCard'

interface Props {
  log: LogEntry[] // most recent first
}

function PlayCards({ cards }: { cards: NonNullable<LogEntry['move']>['cards'] }) {
  return (
    <span className="font-mono">
      {cards.map((card, ci) => (
        <span key={card.id} className={SUIT_COLOR[card.suit]}>
          {ci > 0 && ' '}
          {card.rank}
          {card.suit}
        </span>
      ))}
    </span>
  )
}

function PlayChips({ cards }: { cards: NonNullable<LogEntry['move']>['cards'] }) {
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {cards.map((card) => (
        <span
          key={card.id}
          className={`bg-chip text-[12px] font-mono font-medium px-1.5 py-[3px] rounded-[4px] leading-none ${SUIT_COLOR[card.suit]}`}
        >
          {card.rank}
          {card.suit}
        </span>
      ))}
    </div>
  )
}

export function RecentPlays({ log }: Props) {
  if (log.length === 0) return null

  return (
    <>
      {/* Mobile strip: horizontal, latest 3 */}
      <div className="lg:hidden h-10 px-3 flex items-center gap-2.5 bg-surface border border-line rounded-xl text-[13px] whitespace-nowrap overflow-hidden">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Recent</span>
        {log.slice(0, 3).map((entry, i) => (
          <span key={i} className="flex items-center gap-2.5">
            {i > 0 && <span aria-hidden="true" className="text-card-line">/</span>}
            {entry.move === null ? (
              <span className="text-muted">{SEAT_NAMES[entry.seat]} passed</span>
            ) : (
              <span className={i === 0 ? 'text-ink' : 'text-muted'}>
                {SEAT_NAMES[entry.seat]} <PlayCards cards={entry.move.cards} />
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Desktop list: vertical, up to 8 */}
      <div className="hidden lg:flex flex-col gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1">Recent plays</h2>
        {log.map((entry, i) => (
          <div key={i} className="flex items-center justify-between text-[14px] min-h-[22px]">
            <span className={i === 0 ? 'text-ink font-medium' : 'text-muted'}>{SEAT_NAMES[entry.seat]}</span>
            {entry.move === null ? (
              <span className="text-muted text-[13px]">Passed</span>
            ) : (
              <PlayChips cards={entry.move.cards} />
            )}
          </div>
        ))}
      </div>
    </>
  )
}
