import { useState } from 'react'
import { loadReplay, ReplayData } from '../game/session'

const SEAT_NAMES = ['You', 'Lan', 'Minh', 'Tuấn']

interface Props {
  puzzleDate: string
  onClose: () => void
}

function buildReplayText(replay: ReplayData): string {
  return replay.rounds.map((round, ri) => {
    const header = `Round ${ri + 1}`
    const lines = round.turns
      .filter(t => t.action !== 'finished')
      .map((t, i) => {
        const name = SEAT_NAMES[t.seat]
        const num = i + 1
        if (t.action === 'pass') return `${num}. ${name}: Pass`
        if (t.action === 'skipped') return `${num}. ${name}: Skipped`
        return `${num}. ${name}: ${t.cards.map(c => c.id).join(' ')}`
      })
    return [header, ...lines].join('\n')
  }).join('\n\n')
}

export function ReplayModal({ puzzleDate, onClose }: Props) {
  const replay = loadReplay(puzzleDate)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  function handleCopy() {
    if (!replay) return
    const text = buildReplayText(replay)
    navigator.clipboard.writeText(text).then(() => {
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    }).catch(() => {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 3000)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="max-w-sm w-full bg-green-900 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Game Replay</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Turn list */}
        <div className="overflow-y-auto max-h-72 flex flex-col gap-3">
          {replay === null ? (
            <p className="text-gray-400 text-sm text-center">No replay available.</p>
          ) : (
            replay.rounds.map((round, ri) => (
              <div key={ri}>
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">
                  Round {ri + 1}
                </div>
                <div className="font-mono text-sm space-y-0.5">
                  {round.turns
                    .filter(t => t.action !== 'finished')
                    .map((turn, i) => {
                      const name = SEAT_NAMES[turn.seat]
                      const num = i + 1
                      if (turn.action === 'skipped') {
                        return (
                          <div key={i} className="text-gray-500 italic">
                            {num}. {name}: Skipped
                          </div>
                        )
                      }
                      if (turn.action === 'pass') {
                        return (
                          <div key={i} className="text-gray-200">
                            {num}. {name}: Pass
                          </div>
                        )
                      }
                      return (
                        <div key={i} className="text-gray-200">
                          {num}. {name}: {turn.cards.map(c => c.id).join(' ')}
                        </div>
                      )
                    })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl transition-colors text-sm"
        >
          {copyState === 'copied' ? '✓ Copied!' : copyState === 'error' ? 'Copy failed — check permissions' : 'Copy'}
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
