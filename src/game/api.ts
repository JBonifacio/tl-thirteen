export interface LeaderboardEntry {
  nickname: string
  position: number
  moves: number
  elapsedMs: number
  hintPenaltyMs: number
}

export interface LeaderboardResponse {
  scores: LeaderboardEntry[]
  yourRank: number
}

export interface SubmitScoreParams {
  puzzleDate: string
  nickname: string
  position: number
  moves: number
  elapsedMs: number
  hintPenaltyMs: number
}

export async function submitScore(params: SubmitScoreParams): Promise<LeaderboardResponse> {
  const res = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to submit score')
  }
  return res.json()
}

export async function getLeaderboard(date: string): Promise<LeaderboardResponse> {
  const res = await fetch(`/api/scores/${date}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to fetch leaderboard')
  }
  return res.json()
}
