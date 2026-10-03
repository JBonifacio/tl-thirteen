import { Card, Suit } from '../game/cards'

export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  card?: Card // omit for a face-down card whose identity is hidden
  size?: CardSize
  faceDown?: boolean
  selected?: boolean
  tone?: 'accent' | 'warn' // outline color while selected
  marked?: boolean // face-up card identified by a tell (shown in an opponent's hand)
  onClick?: () => void
  className?: string
}

// Dimensions match the design canvas
const SIZES: Record<CardSize, { box: string; rank: string; suit: string; pip?: string }> = {
  xs: { box: 'w-[26px] h-[38px] rounded-[5px] pt-[3px] pl-[3px]', rank: 'text-[11px]', suit: 'text-[10px]' },
  sm: { box: 'w-[34px] h-[50px] rounded-[6px] pt-1 pl-1', rank: 'text-[13px]', suit: 'text-[12px]' },
  md: { box: 'w-12 h-[72px] rounded-lg pt-1.5 pl-1.5', rank: 'text-[15px]', suit: 'text-[13px]' },
  lg: { box: 'w-16 h-[92px] rounded-[10px] pt-[7px] px-2 pb-[7px]', rank: 'text-lg', suit: 'text-[15px]', pip: 'text-[26px]' },
  xl: { box: 'w-[88px] h-[126px] rounded-xl pt-2.5 px-[11px] pb-2.5', rank: 'text-2xl', suit: 'text-xl', pip: 'text-4xl' },
}

const SUIT_COLOR: Record<Suit, string> = {
  '♠': 'text-suit-spade',
  '♣': 'text-suit-club',
  '♦': 'text-suit-diamond',
  '♥': 'text-suit-heart',
}

const SUIT_NAME: Record<Suit, string> = {
  '♠': 'spades',
  '♣': 'clubs',
  '♦': 'diamonds',
  '♥': 'hearts',
}

const RANK_NAME: Record<string, string> = { J: 'Jack', Q: 'Queen', K: 'King', A: 'Ace' }

export function cardLabel(card: Card): string {
  return `${RANK_NAME[card.rank] ?? card.rank} of ${SUIT_NAME[card.suit]}`
}

export function PlayingCard({
  card,
  size = 'md',
  faceDown = false,
  selected = false,
  tone = 'accent',
  marked = false,
  onClick,
  className = '',
}: Props) {
  const s = SIZES[size]
  // relative: a lifted (transformed) card would otherwise paint above its
  // non-positioned right-hand neighbour and hide that card's corner index
  const base = `${s.box} relative box-border flex-shrink-0 select-none`

  if (faceDown || !card) {
    return (
      <div
        role="img"
        aria-label="Hidden card"
        className={`${base} card-back border border-back-edge shadow-sm shadow-shadow/10 ${className}`}
      />
    )
  }

  const outline = selected || marked
    ? `border-[1.5px] ${tone === 'warn' && selected ? 'border-warn' : 'border-accent'}`
    : 'border border-card-line'
  const lift = selected ? '-translate-y-3.5 shadow-lg shadow-shadow/15' : 'shadow-sm shadow-shadow/10'

  const face = (
    <>
      <span className="flex flex-col items-start gap-0.5 leading-none">
        <span className={`${s.rank} font-semibold`}>{card.rank}</span>
        <span className={s.suit}>{card.suit}</span>
      </span>
      {s.pip && <span className={`${s.pip} self-end leading-none`}>{card.suit}</span>}
    </>
  )

  const classes = `
    ${base} ${outline} ${lift} ${SUIT_COLOR[card.suit]}
    bg-card-face font-sans flex flex-col justify-between text-left
    transition-transform duration-150 motion-reduce:transition-none
    ${className}
  `

  if (onClick) {
    return (
      <button
        type="button"
        aria-label={cardLabel(card)}
        aria-pressed={selected}
        onClick={onClick}
        className={`${classes} cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
      >
        {face}
      </button>
    )
  }

  return (
    <div role="img" aria-label={cardLabel(card) + (marked ? ', marked' : '')} className={classes}>
      {face}
    </div>
  )
}
