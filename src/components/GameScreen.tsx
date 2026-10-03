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
    <div className="min-h-[100dvh] bg-bg text-ink lg:py-6">
      <div className="max-w-md lg:max-w-[1280px] mx-auto min-h-[100dvh] lg:min-h-0 flex flex-col lg:grid lg:grid-cols-[1fr_280px] lg:gap-8 lg:px-6">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="lg:hidden flex items-center justify-between pl-4 pr-3 pt-3 pb-2">
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

        {/* Main Area */}
        <main className="flex flex-col flex-1 min-w-0">
          {/* Desktop Header (Hidden on Mobile) */}
          <header className="hidden lg:flex items-center justify-between mb-8">
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-semibold">Tien Len</h1>
              <p className="text-sm text-muted">
                Daily <span className="font-mono">#{puzzleNumber}</span> · {shortDate(puzzleDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-mono text-muted bg-surface border border-line px-3 py-1.5 rounded-full">
                <Timer startTime={startTime} endTime={playerEndTime} />
              </div>
              <IconButton icon="help" label="How to play and settings" onClick={() => setHelpOpen(true)} />
            </div>
          </header>

          <section aria-label="Opponents" className="px-4 lg:px-0 pt-1 lg:pt-0 flex flex-col lg:grid lg:grid-cols-3 gap-1.5 lg:gap-4 mb-4 lg:mb-8">
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

          <div className="px-4 lg:hidden pb-3">
            <RecentPlays log={playLog} />
          </div>

          <section
            aria-label="Your hand"
            className="mt-auto bg-surface border-t lg:border border-line rounded-t-3xl lg:rounded-2xl px-4 lg:px-6 pt-4 lg:pt-6 pb-[max(28px,env(safe-area-inset-bottom))] lg:pb-6 shadow-[0_-4px_16px_rgb(var(--c-shadow)/0.04)] lg:shadow-sm"
          >
            <Hand
              hand={hands[0]}
              isActive={isPlayerTurn}
              currentTrick={currentTrick}
              onPlay={playerPlay}
              onPass={playerPass}
              bombsOnly={playerHasPassed}
              mustInclude3S={playLog.length === 0}
              lastPlayedBy={lastPlayedBy}
              waitingFor={isPlaying && currentPlayer !== 0 ? SEAT_NAMES[currentPlayer] : null}
            />
          </section>
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-8 pt-[72px]">
          <section aria-label="Recent plays" className="bg-surface border border-line rounded-2xl p-5">
            <RecentPlays log={playLog} />
          </section>
          <section aria-label="Tells in play today" className="bg-surface border border-line rounded-2xl p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-4">Tells in play today</h2>
            <div className="flex flex-col gap-2.5 text-[14px]">
              {Array.from(new Set(botTells.flat().map(t => t.description))).map((desc, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted">•</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

      </div>

      <OpponentSheet botOffset={openBot} onClose={() => setOpenBot(null)} />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />

      {phase === 'finished' && <ResultsModal />}
    </div>
  )
}
