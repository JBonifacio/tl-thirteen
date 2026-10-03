import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { buildShareParts } from '../game/bot'
import { formatTime, positionLabel } from '../game/puzzle'
import { getRetryCount } from '../game/session'
import { BOT_NAMES } from '../game/players'
import { LeaderboardModal } from './LeaderboardModal'
import { ReplayModal } from './ReplayModal'
import { Sheet } from './ui/Sheet'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'
import { Confetti } from './Confetti'

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
  const [copyError, setCopyError] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showReplay, setShowReplay] = useState(false)
  const [showBotReveals, setShowBotReveals] = useState(false)
  const [timeUntilMidnight, setTimeUntilMidnight] = useState(() => getMsUntilPacificMidnight())

  useEffect(() => {
    const id = setInterval(() => setTimeUntilMidnight(getMsUntilPacificMidnight()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!playerFinishPosition || playerEndTime === null || startTime === null) return null

  const elapsedMs = playerEndTime - startTime
  const position = playerFinishPosition

  const shareParts = buildShareParts(
    puzzleNumber,
    puzzleDate,
    position,
    elapsedMs,
    playerMoveCount,
    hintPenaltyMs,
    isRetry,
  )

  async function handleShare() {
    if (navigator.share && navigator.canShare && navigator.canShare(shareParts)) {
      try {
        await navigator.share(shareParts)
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        // fallthrough to copy
      }
    }
    
    try {
      await navigator.clipboard.writeText(`${shareParts.text}\n${shareParts.url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 2000)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(`${shareParts.text}\n${shareParts.url}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 2000)
    })
  }

  const placeSuffix = ['st', 'nd', 'rd'][position - 1] ?? 'th'

  return (
    <div className="fixed inset-0 z-50 flex items-start lg:items-center justify-center bg-bg lg:bg-black/50 lg:dark:bg-black/70 overflow-y-auto lg:p-6 font-sans">
      {position === 1 && <Confetti />}
      <div className="relative w-full min-h-full lg:min-h-0 lg:max-w-[420px] flex flex-col bg-bg lg:bg-surface text-ink lg:rounded-2xl lg:shadow-2xl px-5 pt-[60px] lg:pt-8 pb-[max(28px,env(safe-area-inset-bottom))] lg:pb-8">
        
        {/* Result Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-baseline font-bold tracking-tight mb-2">
            <span className="text-[72px] leading-none">{position}</span>
            <span className="text-[32px] leading-none">{placeSuffix}</span>
          </div>
          <h2 className="text-[20px] font-semibold text-ink">
            {isRetry ? `Retry #${retryCount}` : `Finished ${position}${placeSuffix} of 4`}
          </h2>
        </div>

        {/* Stats Tiles */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatTile label="Moves" value={String(playerMoveCount)} />
          <StatTile label="Time" value={formatTime(elapsedMs)} />
          {hintPenaltyMs > 0 && (
            <div className="col-span-2 bg-warn/10 text-warn border border-warn/20 rounded-xl p-3 flex items-center justify-between">
              <span className="text-[13px] font-medium">Hint penalty</span>
              <span className="text-[16px] font-bold tabular-nums">+{formatTime(hintPenaltyMs)}</span>
            </div>
          )}
        </div>

        {/* Share Section (First attempt only) */}
        {!isRetry && (
          <div className="flex flex-col gap-3 mb-6">
            <div className="bg-surface lg:bg-bg border border-line rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">What you'll share</h3>
              <pre className="font-mono text-[13px] text-ink whitespace-pre-wrap">
                {shareParts.text}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleShare} className="flex-1" icon="share">
                Share result
              </Button>
              <Button onClick={handleCopy} variant="secondary" className="w-[56px] flex-shrink-0" aria-label="Copy result">
                <Icon name={copied ? 'check' : 'copy'} size={24} strokeWidth={1.5} className={copied ? 'text-accent' : ''} />
              </Button>
            </div>
            {copyError && <p className="text-warn text-[13px] text-center">Unable to copy to clipboard.</p>}
          </div>
        )}

        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          <Button variant="secondary" onClick={() => setShowBotReveals(true)}>Bot Reveals</Button>
          {!isRetry ? (
            <Button variant="secondary" onClick={() => setShowLeaderboard(true)}>Leaderboard</Button>
          ) : (
            <div className="hidden" />
          )}
          {!isRetry ? (
            <Button variant="secondary" onClick={() => setShowReplay(true)} className="col-span-2">View Replay</Button>
          ) : null}
        </div>

        {/* Next puzzle countdown & Play Again */}
        <div className="mt-auto flex flex-col gap-4">
          {!isRetry && (
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col">
                <span className="text-[14px] font-medium text-ink">Next puzzle</span>
                <span className="text-[12px] text-muted">Midnight PT</span>
              </div>
              <span className="text-[20px] font-mono font-bold text-ink tabular-nums">
                {formatCountdown(timeUntilMidnight)}
              </span>
            </div>
          )}
          <Button onClick={retryGame} variant={isRetry ? 'primary' : 'ghost'} className="w-full">
            Play again
          </Button>
        </div>

      </div>

      <Sheet open={showBotReveals} onClose={() => setShowBotReveals(false)} title="Bot Reveals">
        <div className="flex flex-col gap-6 pt-2">
          {botTells.map((tells, bi) => {
            const name = BOT_NAMES[bi]
            return (
              <div key={bi} className="flex flex-col gap-3">
                <h3 className="text-[15px] font-semibold text-ink">{name}</h3>
                <div className="flex flex-col gap-2">
                  {tells.map(t => {
                    const confirmed = confirmedTells[bi].has(t.id)
                    return (
                      <div key={t.id} className="flex items-start gap-2.5">
                        <Icon 
                          name={confirmed ? 'check' : 'lock'} 
                          size={18} 
                          strokeWidth={2} 
                          className={`mt-0.5 ${confirmed ? 'text-accent' : 'text-muted'}`}
                        />
                        <span className={`text-[14px] ${confirmed ? 'text-ink' : 'text-muted italic'}`}>
                          {t.description}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Sheet>

      {showReplay && <ReplayModal puzzleDate={puzzleDate} onClose={() => setShowReplay(false)} />}
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

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface lg:bg-bg border border-line rounded-xl p-3 flex flex-col gap-1 items-center justify-center">
      <span className="text-[12px] font-medium text-muted uppercase tracking-[0.08em]">{label}</span>
      <span className="text-[24px] font-bold text-ink tabular-nums leading-none">{value}</span>
    </div>
  )
}
