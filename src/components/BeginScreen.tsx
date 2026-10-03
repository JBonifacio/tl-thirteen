import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'
import { IconButton } from './ui/IconButton'
import { HelpSheet } from './HelpSheet'

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function BeginScreen() {
  const { puzzleNumber, puzzleDate, startGame } = useGameStore()
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <div className="min-h-[100dvh] bg-bg text-ink flex flex-col items-center pt-[10vh] pb-[max(24px,env(safe-area-inset-bottom))] px-5 font-sans relative">
      <div className="absolute top-3 right-3 lg:top-5 lg:right-5">
        <IconButton icon="help" label="Help & Settings" onClick={() => setHelpOpen(true)} />
      </div>

      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      <div className="flex-1 flex flex-col items-center w-full max-w-[420px]">
        
        {/* Suit mark & Title */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="flex items-center gap-1.5 text-[22px] mb-4">
            <span className="text-suit-spade">♠</span>
            <span className="text-suit-heart">♥</span>
            <span className="text-suit-club">♣</span>
            <span className="text-suit-diamond">♦</span>
          </div>
          <h1 className="text-[44px] font-bold tracking-tight leading-[1.1] mb-2">Tien Len Daily</h1>
          <p className="text-[15px] text-muted">
            Daily <span className="font-mono">#{puzzleNumber}</span> · {formatDate(puzzleDate)}
          </p>
        </div>

        {/* Rules */}
        <div className="w-full flex flex-col gap-4 text-[14px] leading-relaxed mb-10">
          <div className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white text-[12px] font-bold flex-shrink-0">1</span>
            <p>
              Shed all your cards before your opponents. Cards rank <span className="font-mono bg-chip px-1 py-0.5 rounded text-[13px]">3 → 2</span>, suits rank <span className="font-mono bg-chip px-1 py-0.5 rounded text-[13px]">♠ ♣ ♦ ♥</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white text-[12px] font-bold flex-shrink-0">2</span>
            <p>
              Play singles, pairs, triples, straights, or sequences of pairs — beat the current play with the same type and count.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white text-[12px] font-bold flex-shrink-0">3</span>
            <p>
              <span className="font-mono bg-chip px-1 py-0.5 rounded text-[13px]">3♠</span> leads first. Pass at any time — but once you pass, you're out until the next round begins.
            </p>
          </div>
        </div>

        {/* Hints */}
        <div className="w-full flex flex-col gap-3 text-[13px] text-muted mb-8">
          <div className="flex gap-2.5">
            <Icon name="eye" size={16} strokeWidth={2} className="flex-shrink-0 mt-[1px]" />
            <p><strong className="text-ink font-medium">Watch the bots.</strong> Each opponent has hidden behavioral tells. Watch how they play to outmaneuver them.</p>
          </div>
          <div className="flex gap-2.5">
            <Icon name="chart" size={16} strokeWidth={2} className="flex-shrink-0 mt-[1px]" />
            <p><strong className="text-ink font-medium">Scoring.</strong> Finish 1st in as few moves as possible. Position first, then moves, then time.</p>
          </div>
        </div>

        {/* Play button */}
        <div className="mt-auto w-full pt-6">
          <Button onClick={startGame} className="w-full shadow-lg shadow-accent/20">
            Play Puzzle
          </Button>
        </div>

      </div>
    </div>
  )
}
