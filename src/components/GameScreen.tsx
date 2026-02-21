import { useGameStore } from '../store/gameStore'
import { BotPanel } from './BotPanel'
import { PlayArea } from './PlayArea'
import { Hand } from './Hand'
import { Timer } from './Timer'
import { TellHUD } from './TellHUD'
import { ResultsModal } from './ResultsModal'
import { getTellPool } from '../game/tells'
import { RecentPlays } from './RecentPlays'

export function GameScreen() {
  const {
    hands,
    currentPlayer,
    currentTrick,
    lastPlayedBy,
    finishOrder,
    startTime,
    playerEndTime,
    phase,
    playLog,
    botTells,
    confirmedTells,
    puzzleNumber,
    puzzleDate,
    playerPlay,
    playerPass,
    revealHint,
  } = useGameStore()

  const tellPool = getTellPool(botTells)

  function getBotSeat(offset: number) {
    // offset 0→seat 1, 1→seat 2, 2→seat 3
    return offset + 1
  }

  return (
    <div className="min-h-screen bg-green-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-green-900/80 border-b border-green-800">
        <div className="text-white font-semibold text-sm">
          🃏 Tien Len Daily <span className="text-green-400">#{puzzleNumber}</span>
          <span className="text-gray-500 text-xs ml-2">{puzzleDate}</span>
        </div>
        <Timer startTime={startTime} endTime={playerEndTime} />
      </div>

      <div className="flex flex-1 gap-3 p-3 overflow-auto">
        {/* Left sidebar: tells HUD */}
        <div className="hidden md:flex flex-col gap-3 w-48 flex-shrink-0">
          <TellHUD pool={tellPool} />
        </div>

        {/* Main game area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Bot panels */}
          <div className="flex gap-3 flex-wrap justify-center">
            {[0, 1, 2].map(bi => {
              const seat = getBotSeat(bi)
              const hand = hands[seat]
              const finishPos = finishOrder.includes(seat)
                ? finishOrder.indexOf(seat) + 1
                : null
              return (
                <BotPanel
                  key={seat}
                  seat={seat}
                  cardCount={hand.length}
                  isActive={currentPlayer === seat && phase === 'playing'}
                  isFinished={hand.length === 0}
                  finishPosition={finishPos}
                  tells={botTells[bi]}
                  confirmedTells={confirmedTells[bi]}
                  onRevealHint={() => revealHint(bi)}
                  hintAvailable={botTells[bi].some(t => !confirmedTells[bi].has(t.id))}
                />
              )
            })}
          </div>

          {/* Play area (table) */}
          <div className="flex-1 flex items-center justify-center bg-green-900/40 rounded-xl border border-green-800 min-h-[120px]">
            <PlayArea
              currentTrick={currentTrick}
              lastPlayedBy={lastPlayedBy}
            />
          </div>

          {/* Recent plays */}
          <RecentPlays log={playLog} />

          {/* Player hand */}
          <div className="bg-green-900/60 rounded-xl border border-green-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold text-sm">
                Your hand
                {currentPlayer === 0 && phase === 'playing' && (
                  <span className="ml-2 text-yellow-400 text-xs animate-pulse">● Your turn</span>
                )}
              </span>
              <span className="text-gray-400 text-xs">{hands[0].length} cards</span>
            </div>
            <Hand
              hand={hands[0]}
              isActive={currentPlayer === 0 && phase === 'playing'}
              currentTrick={currentTrick}
              onPlay={playerPlay}
              onPass={playerPass}
            />
          </div>

          {/* Mobile tells */}
          <div className="md:hidden">
            <TellHUD pool={tellPool} />
          </div>
        </div>
      </div>

      {/* Results modal */}
      {phase === 'finished' && <ResultsModal />}
    </div>
  )
}
