import { TellPoolEntry } from '../game/tells'

interface Props {
  pool: TellPoolEntry[]
}

export function TellHUD({ pool }: Props) {
  if (pool.length === 0) return null

  return (
    <div className="bg-green-950 border border-green-700 rounded-xl p-3 text-xs">
      <div className="text-gray-400 font-semibold mb-2 uppercase tracking-wide text-[10px]">
        Today's tells in play
      </div>
      <div className="space-y-1.5">
        {pool.map(({ tell, count }) => (
          <div key={tell.id} className="flex items-center gap-2">
            <span className="text-yellow-400 font-mono">×{count}</span>
            <span className="text-gray-200">{tell.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
