import { RefObject, useLayoutEffect, useRef, useState } from 'react'
import { Card } from '../game/cards'
import { PlayingCard, CardSize } from './PlayingCard'

// ── layout ────────────────────────────────────────────────────────────────────

/** Tracks an element's content width; Infinity until first measured. */
export function useWidth(ref: RefObject<HTMLElement>): number {
  const [width, setWidth] = useState(Infinity)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

/** Distance between card left edges so `count` cards fit in `width` (clamped to [min, preferred]). */
export function fitStep(count: number, cardWidth: number, width: number, preferred: number, min: number): number {
  if (count <= 1 || !Number.isFinite(width)) return preferred
  return Math.max(min, Math.min(preferred, (width - cardWidth) / (count - 1)))
}

const CARD_WIDTH: Partial<Record<CardSize, number>> = { xs: 26, sm: 34 }

// Steps (left edge to left edge) per size: revealed cards sit side by side, backs overlap
const STEPS = {
  xs: { revealed: 29, revealedMin: 15, hidden: 12, hiddenMin: 5, gap: 10 },
  sm: { revealed: 38, revealedMin: 20, hidden: 15, hiddenMin: 6, gap: 14 },
}

/**
 * Revealed cards first, then a gap, then backs. Squeezes revealed spacing first,
 * then the backs, then the gap, so the fan always fits its container.
 */
function layoutFan(revealed: number, hidden: number, size: 'xs' | 'sm', width: number) {
  const w = CARD_WIDTH[size]!
  const p = STEPS[size]
  let rs = p.revealed
  let hs = p.hidden
  let gap = p.gap
  const total = () =>
    (revealed ? w + (revealed - 1) * rs : 0) +
    (hidden ? (revealed ? gap : 0) + w + (hidden - 1) * hs : 0)

  if (Number.isFinite(width)) {
    if (total() > width && revealed > 1) rs = Math.max(p.revealedMin, rs - (total() - width) / (revealed - 1))
    if (total() > width && hidden > 1) hs = Math.max(p.hiddenMin, hs - (total() - width) / (hidden - 1))
    if (total() > width && revealed && hidden) gap = 4
  }
  return { rs, hs, gap, w }
}

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  revealed: Card[] // face up, shown first
  hidden: (Card | null)[] // null = card back; a Card here is a marked card shown face up in place
  size?: 'xs' | 'sm'
  className?: string
}

/** An opponent's hand seen across the table: no counts, just the fan. */
export function CardFan({ revealed, hidden, size = 'xs', className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useWidth(ref)
  const { rs, hs, gap, w } = layoutFan(revealed.length, hidden.length, size, width)

  return (
    <div ref={ref} className={`flex items-center min-w-0 ${className}`}>
      {revealed.map((card, i) => (
        <PlayingCard
          key={card.id}
          card={card}
          size={size}
          style={{ marginLeft: i === 0 ? 0 : rs - w }}
        />
      ))}
      {hidden.map((card, i) => {
        const marginLeft = i === 0 ? (revealed.length ? gap : 0) : hs - w
        return card ? (
          <PlayingCard key={card.id} card={card} size={size} marked style={{ marginLeft }} />
        ) : (
          <PlayingCard key={`back-${i}`} size={size} faceDown style={{ marginLeft }} />
        )
      })}
    </div>
  )
}
