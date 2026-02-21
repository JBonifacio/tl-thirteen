import { Card, isRedSuit } from '../game/cards'

interface Props {
  card: Card
  selected?: boolean
  faceDown?: boolean
  onClick?: () => void
  small?: boolean
}

export function CardComponent({ card, selected = false, faceDown = false, onClick, small = false }: Props) {
  const red = isRedSuit(card.suit)

  if (faceDown) {
    return (
      <div
        className={`
          ${small ? 'w-8 h-12' : 'w-14 h-20'}
          rounded-lg border-2 border-gray-600 bg-gradient-to-br from-blue-900 to-blue-800
          flex items-center justify-center shadow-md flex-shrink-0
        `}
      >
        <span className="text-blue-400 text-lg select-none">🂠</span>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`
        ${small ? 'w-8 h-12 text-xs' : 'w-14 h-20 text-sm'}
        rounded-lg border-2 shadow-md flex-shrink-0 select-none
        flex flex-col justify-between p-1
        bg-white
        transition-all duration-150
        ${onClick ? 'cursor-pointer hover:brightness-95 active:brightness-90' : ''}
        ${selected ? '-translate-y-3 border-yellow-400 shadow-yellow-300 shadow-lg' : 'border-gray-300'}
        ${red ? 'text-red-600' : 'text-gray-900'}
      `}
    >
      <div className="font-bold leading-none">{card.rank}</div>
      <div className={`${small ? 'text-base' : 'text-xl'} text-center leading-none`}>{card.suit}</div>
      <div className="font-bold leading-none self-end rotate-180">{card.rank}</div>
    </div>
  )
}
