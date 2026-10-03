import { Card, compareCards } from '../game/cards'
import { positionLabel } from '../game/puzzle'
import { TellDefinition } from '../game/tells'
import { CardFan } from './CardFan'
import { Icon } from './ui/Icon'
import { FOCUS_RING } from './ui/Button'
import { useMediaQuery } from '../hooks/useMediaQuery'

/** Splits a bot's hand into what the player can see: revealed cards, then backs with marked cards in place. */
export function opponentView(hand: Card[], revealedIds: Set<string>, markedIds: Set<string>) {
  const revealed = hand.filter(c => revealedIds.has(c.id))
  const hidden = hand
    .filter(c => !revealedIds.has(c.id))
    .sort(compareCards)
    .map(c => (markedIds.has(c.id) ? c : null))
  return { revealed, hidden }
}

interface Props {
  name: string
  hand: Card[]
  revealedCardIds: Set<string>
  markedCardIds: Set<string>
  tells: TellDefinition[]
  confirmedTells: Set<string>
  isActive: boolean
  hasPassed: boolean
  finishPosition: number | null
  onOpen: () => void
}

export function OpponentRow({
  name,
  hand,
  revealedCardIds,
  markedCardIds,
  tells,
  confirmedTells,
  isActive,
  hasPassed,
  finishPosition,
  onOpen,
}: Props) {
  const { revealed, hidden } = opponentView(hand, revealedCardIds, markedCardIds)
  const found = tells.filter(t => confirmedTells.has(t.id)).length
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Counts are deliberately not shown on screen (you glance at a real table), but screen readers get them
  const label = finishPosition !== null
    ? `${name}: finished ${positionLabel(finishPosition)}. Show details.`
    : `${name}: ${hand.length} cards, ${revealed.length} revealed, ${found} of ${tells.length} tells found` +
      `${isActive ? ', playing now' : hasPassed ? ', passed' : ''}. Show details.`

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={`
        w-full lg:w-auto h-[60px] lg:h-auto lg:min-h-[140px] flex lg:flex-col items-center lg:items-start gap-2.5 lg:gap-4
        pl-3 pr-2 lg:p-4 text-left bg-surface rounded-[14px] lg:rounded-2xl border transition-colors
        ${isActive ? 'border-accent' : 'border-line hover:border-card-line'} ${FOCUS_RING}
      `}
    >
      <span className="w-[96px] lg:w-full flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-[5px] lg:gap-2">
        <span className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-sm font-semibold truncate">{name}</span>
          {isActive && <span className="text-[11px] font-medium text-accent-text">Playing…</span>}
          {!isActive && hasPassed && <span className="text-[11px] text-muted">Passed</span>}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted">
          {tells.map(t => (
            <span
              key={t.id}
              className={`w-[7px] h-[7px] rounded-full border-[1.5px] ${
                confirmedTells.has(t.id) ? 'bg-accent border-accent' : 'border-card-line'
              }`}
            />
          ))}
          <span className="ml-0.5 lg:hidden">tells</span>
        </span>
      </span>

      {finishPosition !== null ? (
        <span className="flex-1 lg:flex-none text-sm text-muted">Finished {positionLabel(finishPosition)}</span>
      ) : (
        <CardFan revealed={revealed} hidden={hidden} size={isDesktop ? 'sm' : 'xs'} className="flex-1 lg:flex-none lg:w-full lg:mt-auto" />
      )}

      <Icon name="chevron-right" size={16} strokeWidth={2} className="text-muted lg:hidden" />
    </button>
  )
}
