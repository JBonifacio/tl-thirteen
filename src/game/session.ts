import { TellDefinition, TELL_REGISTRY } from './tells'
import { Card } from './cards'

// ── Shape stored in localStorage ──────────────────────────────────────────────

export type ReplayAction = 'play' | 'pass' | 'skipped' | 'finished'

export interface ReplayTurn {
  seat: number
  action: ReplayAction
  cards: Card[]         // full { rank, suit, id } objects; [] for pass/skipped/finished
  position?: number     // 1-based finish position; only present when action === 'finished'
}

export interface ReplayRound {
  turns: ReplayTurn[]
}

export interface ReplayData {
  date: string          // 'YYYY-MM-DD'
  rounds: ReplayRound[]
}

export interface StoredSession {
  playerFinishPosition: number
  elapsedMs: number
  playerMoveCount: number
  hintPenaltyMs: number
  // Tell IDs only — filter functions are not serialisable
  botTellIds: [string[], string[], string[]]
  confirmedTellIds: [string[], string[], string[]]
}

// ── User Token management ────────────────────────────────────────────────────

const USER_TOKEN_KEY = 'tl_user_token'

export function getUserToken(): string {
  let token = localStorage.getItem(USER_TOKEN_KEY)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(USER_TOKEN_KEY, token)
  }
  return token
}

// ── Keys ──────────────────────────────────────────────────────────────────────

const resultKey    = (date: string) => `tl_result_${date}`
const startedKey   = (date: string) => `tl_started_${date}`
const submittedKey = (date: string) => `tl_submitted_${date}`

// ── Public API ────────────────────────────────────────────────────────────────

export function markStarted(date: string): void {
  localStorage.setItem(startedKey(date), 'true')
}

export function hasStarted(date: string): boolean {
  return localStorage.getItem(startedKey(date)) === 'true'
}

export function saveResult(date: string, result: StoredSession): void {
  localStorage.setItem(resultKey(date), JSON.stringify(result))
}

export function loadResult(date: string): StoredSession | null {
  const raw = localStorage.getItem(resultKey(date))
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

// ── Leaderboard submission tracking ──────────────────────────────────────────

export function markSubmitted(date: string): void {
  localStorage.setItem(submittedKey(date), 'true')
}

export function hasSubmitted(date: string): boolean {
  return localStorage.getItem(submittedKey(date)) === 'true'
}

// ── Retry count tracking ──────────────────────────────────────────────────────

const retryCountKey = (date: string) => `tl_retrycount_${date}`

export function incrementRetryCount(date: string): void {
  const current = getRetryCount(date)
  localStorage.setItem(retryCountKey(date), String(current + 1))
}

export function getRetryCount(date: string): number {
  const raw = localStorage.getItem(retryCountKey(date))
  if (!raw) return 0
  const n = parseInt(raw, 10)
  return isNaN(n) ? 0 : n
}

// ── Replay persistence ────────────────────────────────────────────────────────

const replayKey = (date: string) => `tl_replay_${date}`

export function saveReplay(date: string, replay: ReplayData): void {
  localStorage.setItem(replayKey(date), JSON.stringify(replay))
}

export function loadReplay(date: string): ReplayData | null {
  const raw = localStorage.getItem(replayKey(date))
  if (!raw) return null
  try {
    return JSON.parse(raw) as ReplayData
  } catch {
    return null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve stored tell IDs back to full TellDefinition objects. */
export function resolveTells(ids: string[]): TellDefinition[] {
  return ids.map(id => {
    const found = TELL_REGISTRY.find(t => t.id === id)
    // Fallback: return a no-op tell if the registry no longer has the ID
    return found ?? {
      id,
      category: 'preservation' as const,
      label: id,
      description: '',
      priority: 99,
      confirmThreshold: 99,
      filter: (candidates) => candidates,
    }
  })
}
