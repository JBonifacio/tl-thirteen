import { Sheet } from './ui/Sheet'
import { ThemeSwitch } from './ThemeSwitch'

interface Props {
  open: boolean
  onClose: () => void
}

const RULES = [
  {
    title: 'Shed every card first',
    body: (
      <>
        Ranks run 3 low to 2 high. Suits rank <span className="text-suit-spade">♠</span>{' '}
        <span className="text-suit-club">♣</span> <span className="text-suit-diamond">♦</span>{' '}
        <span className="text-suit-heart">♥</span>. Whoever holds 3♠ leads.
      </>
    ),
  },
  {
    title: 'Beat the play on the table',
    body: 'Same type, same count, higher cards. A bomb — four of a kind or 3+ consecutive pairs — beats a single 2.',
  },
  {
    title: 'Pass with care',
    body: 'Once you pass, you sit out until the next round begins — unless someone plays a single 2 and you can bomb back in.',
  },
]

export function HelpSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="How to play">
      <div className="flex flex-col gap-7">
        <ol className="flex flex-col gap-5">
          {RULES.map((rule, i) => (
            <li key={rule.title} className="flex gap-3.5 items-start">
              <span className="flex-shrink-0 w-[26px] h-[26px] rounded-full border border-line bg-bg flex items-center justify-center font-mono text-xs">
                {i + 1}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-semibold">{rule.title}</span>
                <span className="text-sm leading-relaxed text-muted">{rule.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <p className="text-[13px] leading-relaxed text-muted">
          Each bot has hidden tells. Tap an opponent to see what you've spotted. Ranked by place, then moves, then time.
        </p>

        <section className="flex flex-col gap-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Appearance</h3>
          <ThemeSwitch />
        </section>
      </div>
    </Sheet>
  )
}
