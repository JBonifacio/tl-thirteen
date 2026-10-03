import { lazy, Suspense, useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { BeginScreen } from './components/BeginScreen'
import { GameScreen } from './components/GameScreen'

// Dev-only UI gallery at ?preview — the DEV check lets the production build drop it
const UiPreview = import.meta.env.DEV ? lazy(() => import('./dev/UiPreview')) : null
const showPreview = !!UiPreview && new URLSearchParams(window.location.search).has('preview')

import { Icon } from './components/ui/Icon'
import { Button } from './components/ui/Button'

function ExpiredScreen({ puzzleDate }: { puzzleDate: string }) {
  return (
    <div className="min-h-[100dvh] bg-bg text-ink flex flex-col items-center justify-center p-5 font-sans">
      <div className="flex flex-col items-center w-full max-w-[420px] text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-surface border border-line flex items-center justify-center text-muted mb-2">
          <Icon name="clock" size={32} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold tracking-tight">Puzzle Expired</h1>
          <p className="text-[15px] text-muted leading-relaxed">
            The puzzle for <span className="font-mono bg-chip px-1.5 py-0.5 rounded text-[14px] text-ink">{puzzleDate}</span> is no longer available. Puzzles can only be played within 24 hours of their date.
          </p>
        </div>
        <div className="w-full mt-4">
          <Button onClick={() => window.location.assign('/')} className="w-full">
            Play Today's Puzzle
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { phase, isExpired, puzzleDate, initGame } = useGameStore()

  useEffect(() => {
    initGame()
  }, [initGame])

  if (showPreview && UiPreview) return <Suspense fallback={null}><UiPreview /></Suspense>
  if (isExpired) return <ExpiredScreen puzzleDate={puzzleDate} />
  if (phase === 'begin') return <BeginScreen />
  return <GameScreen />
}
