import { useGameStore } from '../store/gameStore'
import { BOT_NAMES } from '../game/players'
import { getTellPool } from '../game/tells'
import { CardFan } from './CardFan'
import { opponentView } from './OpponentRow'
import { Sheet } from './ui/Sheet'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

interface Props {
  botOffset: number | null // 0–2; null = closed
  onClose: () => void
}

export function OpponentSheet({ botOffset, onClose }: Props) {
  const { hands, botTells, confirmedTells, botRevealedCardIds, botMarkedCardIds, revealHint } = useGameStore()
  if (botOffset === null) return null

  const seat = botOffset + 1
  const hand = hands[seat]
  const tells = botTells[botOffset]
  const confirmed = confirmedTells[botOffset]
  const found = tells.filter(t => confirmed.has(t.id)).length
  const { revealed, hidden } = opponentView(hand, botRevealedCardIds[botOffset], botMarkedCardIds[botOffset])
  const canReveal = hand.length > 0 && found < tells.length
  const pool = getTellPool(botTells)

  return (
    <Sheet
      open
      onClose={onClose}
      title={BOT_NAMES[botOffset]}
      subtitle={`${found} of ${tells.length} tells found`}
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <SectionLabel>Their hand</SectionLabel>
          {hand.length > 0 ? (
            <>
              <CardFan revealed={revealed} hidden={hidden} size="sm" className="py-1" />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-3.5 rounded-[2px] bg-card-face border border-card-line" />
                  Revealed by a tell
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-3.5 rounded-[2px] card-back border border-back-edge" />
                  Unknown
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">No cards left — finished.</p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <SectionLabel>Tells</SectionLabel>
          <ul className="border border-line rounded-[14px] divide-y divide-line">
            {tells.map(t =>
              confirmed.has(t.id) ? (
                <li key={t.id} className="flex items-center gap-2.5 p-3.5">
                  <Icon name="check-circle" strokeWidth={2} className="text-accent-text" />
                  <span className="text-[15px] font-medium">{t.label}</span>
                </li>
              ) : (
                <li key={t.id} className="flex items-center gap-2.5 p-3.5 text-muted">
                  <Icon name="lock" />
                  <span className="text-[15px]">Hidden — keep watching</span>
                </li>
              ),
            )}
          </ul>
          {canReveal && (
            <Button variant="secondary" className="justify-between" onClick={() => revealHint(botOffset)}>
              <span>Reveal hidden tell</span>
              <span className="font-mono text-[13px] text-warn">+1:00</span>
            </Button>
          )}
        </section>

        <section className="flex flex-col gap-2.5">
          <SectionLabel>In play today · all bots</SectionLabel>
          <ul className="flex flex-col gap-2 text-sm">
            {pool.map(({ tell, count }) => (
              <li key={tell.id} className="flex gap-2.5">
                <span className="w-[22px] font-mono text-muted">×{count}</span>
                {tell.label}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Sheet>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{children}</h3>
}
