import { TellDefinition, TELL_REGISTRY } from './tells'

// ── Shape stored in localStorage ──────────────────────────────────────────────

export interface StoredSession {
  playerFinishPosition: number
  elapsedMs: number
  playerMoveCount: number
  hintPenaltyMs: number
  // Tell IDs only — filter functions are not serialisable
  botTellIds: [string[], string[], string[]]
  confirmedTellIds: [string[], string[], string[]]
}

// ── Keys ──────────────────────────────────────────────────────────────────────

const resultKey  = (date: string) => `tl_result_${date}`
const startedKey = (date: string) => `tl_started_${date}`

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
