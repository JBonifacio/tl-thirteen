import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { buildShareText } from '../game/bot'
import { formatTime, positionLabel, positionMedal } from '../game/puzzle'
import { getRetryCount } from '../game/session'
import { LeaderboardModal } from './LeaderboardModal'

export function ResultsModal() {
  const {
    puzzleNumber,
    puzzleDate,
    playerFinishPosition,
    startTime,
    playerEndTime,
    playerMoveCount,
    hintPenaltyMs,
    botTells,
    confirmedTells,
    retryGame,
    isRetry,
  } = useGameStore()

  const retryCount = isRetry ? getRetryCount(puzzleDate) : 0

  const [copied, setCopied] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showBotReveals, setShowBotReveals] = useState(false)
  const [timeUntilMidnight, setTimeUntilMidnight] = useState(() => getMsUntilPacificMidnight())

  useEffect(() => {
    const id = setInterval(() => setTimeUntilMidnight(getMsUntilPacificMidnight()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!playerFinishPosition || playerEndTime === null || startTime === null) return null

  const elapsedMs = playerEndTime - startTime
  const position = playerFinishPosition
  const medal = positionMedal(position)
  const label = positionLabel(position)

  const shareText = buildShareText(
    puzzleNumber,
    puzzleDate,
    position,
    elapsedMs,
    playerMoveCount,
    hintPenaltyMs,
  )

  function handleShare() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const BOT_NAMES = ['Lan', 'Minh', 'Tuấn']

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="max-w-sm w-full bg-green-900 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        {/* Result */}
        <div className="text-center">
          <div className="text-5xl mb-2">{medal || '🎴'}</div>
          <h2 className="text-2xl font-bold text-white">
            Finished {label}!
          </h2>
          {isRetry ? (
            <p className="text-green-400 text-sm mt-1">Retry #{retryCount}</p>
          ) : (
            <p className="text-green-400 text-sm mt-1">Tien Len Daily #{puzzleNumber}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Moves" value={String(playerMoveCount)} />
          <Stat label="Time" value={formatTime(elapsedMs)} />
          {hintPenaltyMs > 0 && (
            <Stat
              label="Hint penalty"
              value={`+${formatTime(hintPenaltyMs)}`}
              className="col-span-2 text-amber-400"
            />
          )}
        </div>

        {/* Next puzzle countdown */}
        {!isRetry && (
          <div className="text-center bg-green-950 rounded-xl p-3">
            <p className="text-gray-300 text-sm font-semibold">Come back tomorrow for a new game!</p>
            <p className="text-green-400 text-2xl font-mono font-bold mt-1 tabular-nums">
              {formatCountdown(timeUntilMidnight)}
            </p>
            <p className="text-gray-500 text-[10px] mt-0.5">New puzzle at midnight PT</p>
          </div>
        )}

        {/* Share */}
        {!isRetry && (
          <button
            onClick={handleShare}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors"
          >
            {copied ? '✓ Copied!' : '📋 Copy Result'}
          </button>
        )}

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowBotReveals(true)}
            className={`py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl transition-colors text-sm${isRetry ? ' col-span-2' : ''}`}
          >
            Bot Reveals
          </button>
          {!isRetry && (
            <button
              onClick={() => setShowLeaderboard(true)}
              className="py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Leaderboard
            </button>
          )}
        </div>

        {/* Play Again */}
        <button
          onClick={retryGame}
          className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
        >
          Play Again
        </button>

      </div>

      {showBotReveals && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="max-w-sm w-full bg-green-900 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white text-center">Bot Reveals</h2>
            <div className="space-y-3 text-xs">
              {botTells.map((tells, bi) => (
                <div key={bi}>
                  <span className="text-gray-300 font-semibold">{BOT_NAMES[bi]}</span>
                  <div className="mt-1 space-y-1 pl-2">
                    {tells.map(t => (
                      <div key={t.id} className="flex items-center gap-1.5">
                        {confirmedTells[bi].has(t.id) ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-gray-600">·</span>
                        )}
                        <span className="text-yellow-200">{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowBotReveals(false)}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <LeaderboardModal
          puzzleDate={puzzleDate}
          position={position}
          moves={playerMoveCount}
          elapsedMs={elapsedMs}
          hintPenaltyMs={hintPenaltyMs}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  )
}

function getMsUntilPacificMidnight(): number {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const h = parseInt(parts.find(p => p.type === 'hour')!.value)
  const m = parseInt(parts.find(p => p.type === 'minute')!.value)
  const s = parseInt(parts.find(p => p.type === 'second')!.value)
  return ((24 * 3600) - (h * 3600 + m * 60 + s)) * 1000
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Stat({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`bg-green-950 rounded-lg p-3 text-center ${className}`}>
      <div className="text-gray-400 text-xs">{label}</div>
      <div className="text-white font-bold text-lg tabular-nums">{value}</div>
    </div>
  )
}
