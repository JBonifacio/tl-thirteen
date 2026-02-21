const EPOCH = '2026-02-20'

export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getPuzzleDate(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('d') ?? getTodayString()
}

export function getPuzzleNumber(dateString: string): number {
  const epoch = new Date(EPOCH).getTime()
  const target = new Date(dateString).getTime()
  return Math.floor((target - epoch) / 86_400_000) + 1
}

export function isPuzzleExpired(dateString: string): boolean {
  return dateString !== getTodayString()
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function positionLabel(pos: number): string {
  return ['1st', '2nd', '3rd', '4th'][pos - 1] ?? `${pos}th`
}

export function positionMedal(pos: number): string {
  return ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49', ''][pos - 1] ?? ''
}
