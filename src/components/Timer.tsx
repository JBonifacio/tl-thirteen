import { useEffect, useState } from 'react'

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

  if (!startTime) {
    return <div className="font-mono text-gray-400 text-sm">0:00</div>
  }

  const elapsed = (endTime ?? now) - startTime
  const totalSec = Math.floor(elapsed / 1000)
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60

  return (
    <div className="font-mono text-white text-sm tabular-nums">
      {mins}:{String(secs).padStart(2, '0')}
    </div>
  )
}
