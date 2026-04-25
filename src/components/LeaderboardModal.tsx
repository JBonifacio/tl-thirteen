import { useState, useEffect, useRef } from 'react'
import { submitScore, getLeaderboard, type LeaderboardResponse } from '../game/api'
import { markSubmitted, hasSubmitted, getUserToken } from '../game/session'
import { formatTime, positionMedal } from '../game/puzzle'
import filter from 'leo-profanity'

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
    if (view === 'nickname') inputRef.current?.focus()
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
        userToken: getUserToken(),
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="max-w-sm w-full bg-green-900 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <h2 className="text-2xl font-bold text-white text-center">Daily Leaderboard</h2>

        {view === 'nickname' ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-gray-300 text-sm block mb-1">Choose a nickname</label>
              <input
                ref={inputRef}
                type="text"
                value={nickname}
                onChange={e => { setNickname(e.target.value); setError('') }}
                onBlur={handleBlur}
                maxLength={16}
                placeholder="3-16 characters"
                className="w-full px-3 py-2 bg-green-950 border border-green-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-xl transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Score'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            {loadError ? (
              <p className="text-red-400 text-sm text-center">{loadError}</p>
            ) : !leaderboard ? (
              <p className="text-gray-400 text-sm text-center">Loading...</p>
            ) : leaderboard.scores.length === 0 ? (
              <p className="text-gray-400 text-sm text-center">No scores yet. Be the first!</p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wide">
                      <th className="text-left py-1 px-1">#</th>
                      <th className="text-left py-1 px-1">Player</th>
                      <th className="text-center py-1 px-1">Place</th>
                      <th className="text-right py-1 px-1">Moves</th>
                      <th className="text-right py-1 px-1">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.scores.map((entry, i) => {
                      const isYou = leaderboard.yourRank === i + 1
                      return (
                        <tr
                          key={i}
                          className={isYou ? 'bg-yellow-500/15 text-yellow-200' : 'text-gray-200'}
                        >
                          <td className="py-1 px-1 tabular-nums">{i + 1}</td>
                          <td className="py-1 px-1 truncate max-w-[100px]">
                            {entry.nickname}{isYou && <span className="text-yellow-400 text-xs ml-1">(you)</span>}
                          </td>
                          <td className="py-1 px-1 text-center">{positionMedal(entry.position) || entry.position}</td>
                          <td className="py-1 px-1 text-right tabular-nums">{entry.moves}</td>
                          <td className="py-1 px-1 text-right tabular-nums">{formatTime(entry.elapsedMs)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
