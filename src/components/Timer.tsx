import { useEffect, useState } from 'react'
import { Icon } from './ui/Icon'

interface Props {
  startTime: number | null
  endTime: number | null
}

export function Timer({ startTime, endTime }: Props) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (endTime) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [endTime])

  const elapsed = startTime ? (endTime ?? now) - startTime : 0
  const totalSec = Math.floor(elapsed / 1000)
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60

  return (
    <div className="flex items-center gap-1.5 h-8 px-3 bg-surface border border-line rounded-full text-muted">
      <Icon name="clock" size={14} strokeWidth={2} />
      <span className="font-mono text-sm text-ink tabular-nums" aria-label={`Elapsed time ${mins} minutes ${secs} seconds`}>
        {mins}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  )
}
