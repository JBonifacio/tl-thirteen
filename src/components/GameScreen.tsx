import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { BOT_NAMES, SEAT_NAMES } from '../game/players'
import { OpponentRow } from './OpponentRow'
import { OpponentSheet } from './OpponentSheet'
import { PlayArea } from './PlayArea'
import { RecentPlays } from './RecentPlays'
import { Hand } from './Hand'
import { Timer } from './Timer'
import { HelpSheet } from './HelpSheet'
import { ResultsModal } from './ResultsModal'
import { IconButton } from './ui/IconButton'

/** "2026-10-02" → "Oct 2" (UTC so the date never shifts with the viewer's timezone) */
function shortDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function GameScreen() {
  const {
    hands,
    currentPlayer,
    currentTrick,
    lastPlayedBy,
    passedThisRound,
    finishOrder,
    startTime,
    playerEndTime,
    phase,
    playLog,
    botTells,
    botRevealedCardIds,
    botMarkedCardIds,
    confirmedTells,
    puzzleNumber,
    puzzleDate,
    playerPlay,
    playerPass,
  } = useGameStore()

  const [openBot, setOpenBot] = useState<number | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const isPlaying = phase === 'playing'
  const isPlayerTurn = isPlaying && currentPlayer === 0
  const playerHasPassed = passedThisRound.includes(0)

  return (
    <div className="min-h-[100dvh] bg-bg text-ink">
      <div className="max-w-md mx-auto min-h-[100dvh] flex flex-col">
        <header className="flex items-center justify-between pl-4 pr-3 pt-3 pb-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-base font-semibold">Tien Len</h1>
            <p className="text-xs text-muted">
              Daily <span className="font-mono">#{puzzleNumber}</span> · {shortDate(puzzleDate)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Timer startTime={startTime} endTime={playerEndTime} />
            <IconButton icon="help" label="How to play and settings" onClick={() => setHelpOpen(true)} />
          </div>
        </header>

        <section aria-label="Opponents" className="px-4 pt-1 flex flex-col gap-1.5">
          {BOT_NAMES.map((name, bi) => {
            const seat = bi + 1
            const hand = hands[seat]
            return (
              <OpponentRow
                key={seat}
                name={name}
                hand={hand}
                revealedCardIds={botRevealedCardIds[bi]}
                markedCardIds={botMarkedCardIds[bi]}
                tells={botTells[bi]}
                confirmedTells={confirmedTells[bi]}
                isActive={isPlaying && currentPlayer === seat}
                hasPassed={!!currentTrick && passedThisRound.includes(seat)}
                finishPosition={hand.length === 0 && finishOrder.includes(seat) ? finishOrder.indexOf(seat) + 1 : null}
                onOpen={() => setOpenBot(bi)}
              />
            )
          })}
        </section>

        <PlayArea
          currentTrick={currentTrick}
          lastPlayedBy={lastPlayedBy}
          currentPlayer={currentPlayer}
          isPlayerTurn={isPlayerTurn}
          isOpeningPlay={playLog.length === 0}
          playerHasPassed={playerHasPassed}
        />

        <div className="px-4 pb-3">
          <RecentPlays log={playLog} />
        </div>

        <section
          aria-label="Your hand"
          className="bg-surface border-t border-line rounded-t-3xl px-4 pt-4 pb-[max(28px,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgb(var(--c-shadow)/0.04)]"
        >
          <Hand
            hand={hands[0]}
            isActive={isPlayerTurn}
            currentTrick={currentTrick}
            onPlay={playerPlay}
            onPass={playerPass}
            bombsOnly={playerHasPassed}
            waitingFor={isPlaying && currentPlayer !== 0 ? SEAT_NAMES[currentPlayer] : null}
          />
        </section>
      </div>

      <OpponentSheet botOffset={openBot} onClose={() => setOpenBot(null)} />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />

      {phase === 'finished' && <ResultsModal />}
    </div>
  )
}
