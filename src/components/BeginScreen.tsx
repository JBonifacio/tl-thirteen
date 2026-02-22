import { useGameStore } from '../store/gameStore'

export function BeginScreen() {
  const { puzzleNumber, puzzleDate, startGame } = useGameStore()

  return (
    <div className="min-h-screen bg-green-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-green-900 rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
        {/* Title */}
        <div className="text-center">
          <div className="text-4xl mb-2">🃏</div>
          <h1 className="text-3xl font-bold text-white">Tien Len Daily</h1>
          <p className="text-green-400 text-sm mt-1">
            #{puzzleNumber} · {puzzleDate}
          </p>
        </div>

        {/* Rules */}
        <div className="bg-green-950 rounded-xl p-4 text-sm text-gray-300 space-y-2">
          <p className="font-semibold text-white text-base">How to play</p>
          <p>
            Shed all your cards before your opponents. Cards rank{' '}
            <span className="font-mono text-yellow-300">3 → 2</span> (low to high),
            suits rank <span className="font-mono text-yellow-300">♠ ♣ ♦ ♥</span>.
          </p>
          <p>
            Play singles, pairs, triples, straights, or sequences of pairs — always
            beat the current play with the same type and count, or play a bomb
            (four-of-a-kind or 3+ consecutive pairs) against a single 2.
          </p>
          <p>
            Whoever holds <span className="font-mono text-yellow-300">3♠</span> leads
            first. You can pass at any time when there's an active play — but once you
            pass, you're out until the next round begins.
          </p>
        </div>

        {/* Tell hint */}
        <div className="bg-amber-900/40 border border-amber-700/50 rounded-xl p-4 text-sm text-amber-200">
          <p className="font-semibold text-amber-300 mb-1">🔍 Watch the bots</p>
          <p>
            Each opponent has hidden behavioral patterns — tells. Watch how they play
            and use what you learn to outmaneuver them. Tells are confirmed as you
            observe them in action.
          </p>
        </div>

        {/* Scoring */}
        <div className="text-xs text-gray-400 text-center">
          Finish <strong className="text-gray-200">1st</strong> in as few moves as possible.
          Position first, then moves (including passes), then time — 1st in 10 moves beats 2nd in 5.
        </div>

        {/* Play button */}
        <button
          onClick={startGame}
          className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-bold text-lg rounded-xl transition-colors shadow-lg"
        >
          Play Puzzle #{puzzleNumber}
        </button>
      </div>
    </div>
  )
}
