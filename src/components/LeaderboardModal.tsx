import { useState, useEffect, useRef } from 'react'
import { submitScore, getLeaderboard, type LeaderboardResponse } from '../game/api'
import { markSubmitted, hasSubmitted } from '../game/session'
import { formatTime } from '../game/puzzle'
import filter from 'leo-profanity'
import { Sheet } from './ui/Sheet'
import { Button } from './ui/Button'

filter.loadDictionary()

const NICKNAME_RE = /^[a-zA-Z0-9 _-]{3,16}$/
const CONSECUTIVE_SPACES_RE = /  /

interface Props {
  puzzleDate: string
  position: number
  moves: number
  elapsedMs: number
  hintPenaltyMs: number
  onClose: () => void
}

function formatPlace(p: number) {
  return `${p}${['st', 'nd', 'rd'][p - 1] ?? 'th'}`
}

export function LeaderboardModal({ puzzleDate, position, moves, elapsedMs, hintPenaltyMs, onClose }: Props) {
  const alreadySubmitted = hasSubmitted(puzzleDate)
  const [view, setView] = useState<'nickname' | 'leaderboard'>(alreadySubmitted ? 'leaderboard' : 'nickname')
  const [nickname, setNickname] = useState(() => localStorage.getItem('tl_nickname') || '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null)
  const [loadError, setLoadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // If already submitted, fetch leaderboard on mount
  useEffect(() => {
    if (alreadySubmitted) {
      getLeaderboard(puzzleDate)
        .then(setLeaderboard)
        .catch(e => setLoadError(e.message))
    }
  }, [alreadySubmitted, puzzleDate])

  // Focus input when nickname view is shown
  useEffect(() => {
    if (view === 'nickname') {
      // small delay to let the sheet render/animate first
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [view])

  function validateNickname(name: string): string | null {
    const trimmed = name.trim()
    if (trimmed.length < 3 || trimmed.length > 16) return 'Nickname must be 3-16 characters'
    if (!NICKNAME_RE.test(trimmed)) return 'Only letters, numbers, spaces, hyphens, underscores'
    if (CONSECUTIVE_SPACES_RE.test(trimmed)) return 'No consecutive spaces allowed'
    if (filter.check(trimmed)) return 'Please choose a different nickname'
    return null
  }

  function handleBlur() {
    const err = validateNickname(nickname)
    setError(err || '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nickname.trim()
    const err = validateNickname(trimmed)
    if (err) {
      setError(err)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const result = await submitScore({
        puzzleDate,
        nickname: trimmed,
        position,
        moves,
        elapsedMs,
        hintPenaltyMs,
      })
      localStorage.setItem('tl_nickname', trimmed)
      markSubmitted(puzzleDate)
      setLeaderboard(result)
      setView('leaderboard')
    } catch (e: any) {
      setError(e.message || 'Failed to submit score')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet
      open={true}
      onClose={onClose}
      title="Leaderboard"
      subtitle={view === 'leaderboard' && leaderboard ? `${leaderboard.scores.length} players` : undefined}
    >
      {view === 'nickname' ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="nickname" className="text-[13px] font-semibold text-ink">Choose a nickname</label>
            <input
              id="nickname"
              ref={inputRef}
              type="text"
              value={nickname}
              onChange={e => { setNickname(e.target.value); setError('') }}
              onBlur={handleBlur}
              maxLength={16}
              placeholder="3-16 characters"
              className={`
                w-full px-4 py-3 bg-surface lg:bg-bg border rounded-xl text-[15px] text-ink placeholder:text-muted focus:outline-none transition-colors
                ${error ? 'border-warn focus:border-warn' : 'border-line focus:border-accent'}
              `}
            />
            {error && <p className="text-[13px] text-warn" role="alert">{error}</p>}
          </div>
          <div className="flex flex-col gap-3 mt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Score'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-6 pt-2">
          {loadError ? (
            <p className="text-[14px] text-warn text-center">{loadError}</p>
          ) : !leaderboard ? (
            <p className="text-[14px] text-muted text-center py-4">Loading...</p>
          ) : leaderboard.scores.length === 0 ? (
            <p className="text-[14px] text-muted text-center py-4">No scores yet. Be the first!</p>
          ) : (
            <>
              {leaderboard.yourRank && (
                <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-text">Your Rank</span>
                  <div className="flex items-baseline gap-2 text-ink">
                    <span className="text-[32px] font-bold tracking-tight leading-none">#{leaderboard.yourRank}</span>
                    <span className="text-[15px] font-medium text-muted">of {leaderboard.scores.length}</span>
                  </div>
                </div>
              )}
              <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2 scrollbar-hide">
                <table className="w-full text-[14px] text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted border-b border-line">
                      <th className="py-2.5 px-2 font-semibold">#</th>
                      <th className="py-2.5 px-2 font-semibold">Player</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Place</th>
                      <th className="py-2.5 px-2 font-semibold text-right">Moves</th>
                      <th className="py-2.5 px-2 font-semibold text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.scores.map((entry, i) => {
                      const isYou = leaderboard.yourRank === i + 1
                      return (
                        <tr
                          key={i}
                          className={`border-b border-line/50 last:border-0 ${
                            isYou ? 'bg-accent/5' : ''
                          }`}
                        >
                          <td className="py-3 px-2 text-muted tabular-nums">{i + 1}</td>
                          <td className="py-3 px-2 font-medium truncate max-w-[120px]">
                            <span className={isYou ? 'text-accent-text' : 'text-ink'}>
                              {entry.nickname}
                            </span>
                            {isYou && <span className="text-accent-text text-[12px] ml-1.5">(you)</span>}
                          </td>
                          <td className="py-3 px-2 text-center text-muted">{formatPlace(entry.position)}</td>
                          <td className="py-3 px-2 text-right tabular-nums">{entry.moves}</td>
                          <td className="py-3 px-2 text-right text-muted tabular-nums">{formatTime(entry.elapsedMs)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  )
}
