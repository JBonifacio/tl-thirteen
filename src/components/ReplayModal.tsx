import { useState } from 'react'
import { SEAT_NAMES } from '../game/players'
import { loadReplay, ReplayData } from '../game/session'
import { Sheet } from './ui/Sheet'
import { Button } from './ui/Button'

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
    <Sheet open={true} onClose={onClose} title="Game Replay">
      <div className="flex flex-col pt-2 h-full max-h-[65vh] lg:max-h-[500px]">
        {replay === null ? (
          <p className="text-[14px] text-muted text-center py-4">No replay available.</p>
        ) : (
          <div className="flex-1 overflow-y-auto -mx-5 px-5 scrollbar-hide pb-4">
            <div className="flex flex-col gap-6">
              {replay.rounds.map((round, ri) => (
                <div key={ri} className="flex flex-col gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted sticky top-0 bg-surface lg:bg-bg py-1 z-10">
                    Round {ri + 1}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {round.turns
                      .filter(t => t.action !== 'finished')
                      .map((turn, i) => {
                        const name = SEAT_NAMES[turn.seat]
                        const num = i + 1
                        
                        if (turn.action === 'skipped') {
                          return (
                            <div key={i} className="flex items-center gap-3 text-[14px] text-muted italic">
                              <span className="w-5 text-right">{num}.</span>
                              <span className="w-12 font-medium">{name}</span>
                              <span>Skipped</span>
                            </div>
                          )
                        }
                        if (turn.action === 'pass') {
                          return (
                            <div key={i} className="flex items-center gap-3 text-[14px] text-muted">
                              <span className="w-5 text-right">{num}.</span>
                              <span className="w-12 font-medium">{name}</span>
                              <span>Pass</span>
                            </div>
                          )
                        }
                        
                        return (
                          <div key={i} className="flex items-center gap-3 text-[14px] text-ink">
                            <span className="w-5 text-right text-muted tabular-nums">{num}.</span>
                            <span className="w-12 font-medium">{name}</span>
                            <div className="flex flex-wrap gap-1">
                              {turn.cards.map(c => {
                                const suitClass = c.suit === '♥' ? 'text-suit-heart' : 
                                                  c.suit === '♦' ? 'text-suit-diamond' : 
                                                  c.suit === '♣' ? 'text-suit-club' : 'text-suit-spade'
                                return (
                                  <span key={c.id} className={`font-mono text-[13px] bg-chip px-1.5 py-0.5 rounded ${suitClass}`}>
                                    {c.id}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 mt-auto">
          <Button
            onClick={handleCopy}
            variant="secondary"
            className="w-full"
            icon={copyState === 'copied' ? 'check' : copyState === 'error' ? 'alert' : 'copy'}
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Failed to copy' : 'Copy Replay'}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
