import { Move } from '../game/moves'
import { CardComponent } from './CardComponent'

interface Props {
  currentTrick: Move | null
  lastPlayedBy: number | null
}

const SEAT_NAMES = ['You', 'Lan', 'Minh', 'Tuấn']

export function PlayArea({ currentTrick, lastPlayedBy }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 min-h-[100px] justify-center">
      {currentTrick ? (
        <>
          <div className="flex gap-1 flex-wrap justify-center">
            {currentTrick.cards.map(card => (
              <CardComponent key={card.id} card={card} />
            ))}
          </div>
          <div className="text-gray-400 text-xs">
            {lastPlayedBy !== null ? SEAT_NAMES[lastPlayedBy] : ''} played{' '}
            <span className="text-gray-300">{comboLabel(currentTrick)}</span>
          </div>
        </>
      ) : (
        <div className="text-gray-500 text-sm italic">No cards played yet — lead any combo</div>
      )}
    </div>
  )
}

function comboLabel(move: Move): string {
  switch (move.type) {
    case 'single': return 'a single'
    case 'pair': return 'a pair'
    case 'triple': return 'a triple'
    case 'four_of_a_kind': return 'four of a kind'
    case 'sequence': return `a ${move.cards.length}-card straight`
    case 'sequence_of_pairs': return `a ${move.cards.length / 2}-pair sequence`
  }
}
