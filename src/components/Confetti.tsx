import { useEffect, useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'

const COLORS = [
  '#C8312A', // red (heart)
  '#1F5FD1', // blue (diamond)
  '#157A3E', // green (club)
  '#111418', // ink (spade - light mode)
  '#EDEFF2', // ink (spade - dark mode)
  '#0F7B5C', // accent
  '#F59E0B', // gold
]

export function Confetti() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [pieces, setPieces] = useState<{ id: number; style: React.CSSProperties }[]>([])

  useEffect(() => {
    if (prefersReducedMotion) return

    const newPieces = Array.from({ length: 60 }).map((_, i) => {
      const left = Math.random() * 100
      const duration = 2 + Math.random() * 2 // 2s to 4s
      const delay = Math.random() * 0.5
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      // Randomly choose between a square, a circle, or a tall rectangle
      const type = Math.random()
      const width = type > 0.8 ? 6 : 8
      const height = type < 0.2 ? 6 : 14
      const borderRadius = type > 0.8 ? '50%' : '2px'

      return {
        id: i,
        style: {
          left: `${left}%`,
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: color,
          borderRadius,
          animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`,
          transform: `translate3d(0, -20px, 0) rotate(${Math.random() * 360}deg)`,
        },
      }
    })

    setPieces(newPieces)

    // Remove pieces from DOM after max duration
    const timer = setTimeout(() => setPieces([]), 4500)
    return () => clearTimeout(timer)
  }, [prefersReducedMotion])

  if (pieces.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translate3d(0, -20px, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(0, 100vh, 0) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden" aria-hidden="true">
        {pieces.map((p) => (
          <div key={p.id} className="absolute top-0 will-change-transform" style={p.style} />
        ))}
      </div>
    </>
  )
}
