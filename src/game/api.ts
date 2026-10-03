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
  // basic obfuscation payload to prevent casual POST requests
  const secret = 'tl_thirteen_salt_2026'
  const msg = `${params.puzzleDate}:${params.nickname.trim()}:${params.position}:${params.moves}:${params.elapsedMs}:${params.hintPenaltyMs}`
  
  const encoder = new TextEncoder()
  const data = encoder.encode(msg + secret)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  let token = localStorage.getItem('tl_token')
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem('tl_token', token)
  }

  const payload = { ...params, nickname: params.nickname.trim(), signature, token }

  const res = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
