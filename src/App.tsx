import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { BeginScreen } from './components/BeginScreen'
import { GameScreen } from './components/GameScreen'

function ExpiredScreen({ puzzleDate }: { puzzleDate: string }) {
  return (
    <div className="min-h-screen bg-green-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-green-900 rounded-2xl shadow-2xl p-8 text-center flex flex-col gap-4">
        <div className="text-5xl">🕰️</div>
        <h1 className="text-2xl font-bold text-white">Puzzle Expired</h1>
        <p className="text-gray-300 text-sm">
          The puzzle for <span className="font-mono text-yellow-300">{puzzleDate}</span> is no
          longer available. Puzzles can only be played within 24 hours of their date.
        </p>
        <a
          href="/"
          className="mt-2 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors block"
        >
          Play Today's Puzzle
        </a>
      </div>
    </div>
  )
}

export default function App() {
  const { phase, isExpired, puzzleDate, initGame } = useGameStore()

  useEffect(() => {
    initGame()
  }, [initGame])

  if (isExpired) return <ExpiredScreen puzzleDate={puzzleDate} />
  if (phase === 'begin') return <BeginScreen />
  return <GameScreen />
}
