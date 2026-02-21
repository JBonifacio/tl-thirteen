import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { buildShareText } from '../game/bot'
import { formatTime, positionLabel, positionMedal } from '../game/puzzle'

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
  } = useGameStore()

  const [copied, setCopied] = useState(false)

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
          <p className="text-green-400 text-sm mt-1">Tien Len Daily #{puzzleNumber}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Time" value={formatTime(elapsedMs)} />
          <Stat label="Moves" value={String(playerMoveCount)} />
          {hintPenaltyMs > 0 && (
            <Stat
              label="Hint penalty"
              value={`+${formatTime(hintPenaltyMs)}`}
              className="col-span-2 text-amber-400"
            />
          )}
        </div>

        {/* Bot tell reveal */}
        <div className="bg-green-950 rounded-xl p-3 text-xs space-y-2">
          <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">
            Bot reveals
          </p>
          {botTells.map((tells, bi) => (
            <div key={bi}>
              <span className="text-gray-300 font-semibold">{BOT_NAMES[bi]}:</span>{' '}
              <span className="text-yellow-200">{tells.map(t => t.label).join(' · ')}</span>
              {tells.some(t => confirmedTells[bi].has(t.id)) && (
                <span className="text-green-400 ml-1">✓ confirmed</span>
              )}
            </div>
          ))}
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors"
        >
          {copied ? '✓ Copied!' : '📋 Copy Result'}
        </button>

        <pre className="text-xs text-gray-400 bg-green-950 rounded-lg p-3 whitespace-pre-wrap break-all">
          {shareText}
        </pre>
      </div>
    </div>
  )
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
