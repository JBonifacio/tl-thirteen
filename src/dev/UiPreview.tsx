// Dev-only gallery of the redesign's shared pieces. Open with ?preview in `npm run dev`.
// Not included in production builds (see App.tsx).
import { useState } from 'react'
import { Card, RANKS, SUITS } from '../game/cards'
import { ThemePref, useThemePref } from '../theme'
import { PlayingCard, CardSize } from '../components/PlayingCard'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { Icon, IconName } from '../components/ui/Icon'
import { Sheet } from '../components/ui/Sheet'

const SIZES: CardSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
const ICONS: IconName[] = [
  'help', 'close', 'copy', 'share', 'replay', 'chart', 'eye',
  'lock', 'check', 'check-circle', 'alert', 'clock', 'chevron-right',
]

const card = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit, id: `${rank}${suit}` })
const SAMPLE = SUITS.map((s, i) => card(RANKS[i * 3 + 1], s))
const HAND = [card('4', '♦'), card('7', '♠'), card('7', '♥'), card('9', '♣'), card('2', '♠')]

export default function UiPreview() {
  const [theme, setTheme] = useThemePref()
  const [selected, setSelected] = useState<Set<string>>(new Set(['7♠', '7♥']))
  const [warn, setWarn] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-bg text-ink px-4 py-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">UI preview</h1>
          <div role="radiogroup" aria-label="Theme" className="flex gap-1 p-1 rounded-full bg-chip">
            {(['system', 'light', 'dark'] as ThemePref[]).map(p => (
              <button
                key={p}
                role="radio"
                aria-checked={theme === p}
                onClick={() => setTheme(p)}
                className={`h-9 px-4 rounded-full text-sm font-medium capitalize ${
                  theme === p ? 'bg-surface shadow-sm shadow-shadow/10' : 'text-muted'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </header>

        <Section title="Card sizes (face up and back)">
          {SIZES.map(size => (
            <div key={size} className="flex flex-wrap items-end gap-2">
              <span className="w-6 text-xs text-muted font-mono">{size}</span>
              {SAMPLE.map(c => <PlayingCard key={c.id} card={c} size={size} />)}
              <PlayingCard size={size} faceDown />
              <PlayingCard card={card('9', '♠')} size={size} marked />
            </div>
          ))}
        </Section>

        <Section title="Opponent fan (xs, overlapped)">
          <div className="flex items-center">
            <PlayingCard card={card('2', '♥')} size="xs" />
            <PlayingCard card={card('K', '♠')} size="xs" className="ml-[3px]" />
            {Array.from({ length: 9 }, (_, i) => (
              <PlayingCard key={i} size="xs" faceDown className={i === 0 ? 'ml-2.5' : '-ml-3.5'} />
            ))}
          </div>
        </Section>

        <Section title="Selectable hand (md)">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={warn} onChange={e => setWarn(e.target.checked)} />
            Invalid selection (warn tone)
          </label>
          <div className="flex pt-4">
            {HAND.map((c, i) => (
              <PlayingCard
                key={c.id}
                card={c}
                size="md"
                selected={selected.has(c.id)}
                tone={warn ? 'warn' : 'accent'}
                onClick={() => toggle(c.id)}
                className={i === 0 ? '' : '-ml-5'}
              />
            ))}
          </div>
        </Section>

        <Section title="Buttons">
          <div className="grid grid-cols-[1fr_2fr] gap-2 max-w-sm">
            <Button variant="secondary">Pass</Button>
            <Button>Play pair</Button>
            <Button variant="secondary" disabled>Pass</Button>
            <Button disabled>Select cards</Button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button size="lg" icon="share">Share result</Button>
            <Button variant="ghost">Play again</Button>
            <IconButton icon="help" label="How to play" />
            <IconButton icon="close" label="Close" filled />
          </div>
        </Section>

        <Section title="Icons">
          <div className="flex flex-wrap gap-4">
            {ICONS.map(name => (
              <div key={name} className="flex flex-col items-center gap-1 w-16">
                <Icon name={name} />
                <span className="text-[10px] text-muted">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Sheet">
          <Button variant="secondary" onClick={() => setSheetOpen(true)} className="max-w-xs">
            Open sheet
          </Button>
        </Section>

        <Section title="Text tokens">
          <p className="text-muted text-sm">Muted text on bg</p>
          <p className="text-accent-text text-sm font-semibold">Accent text</p>
          <p className="text-warn text-sm font-medium">Warning text</p>
          <p className="font-mono">Geist Mono 2:14 · 07:12:09</p>
        </Section>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Lan" subtitle="1 of 2 tells found">
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <PlayingCard card={card('2', '♥')} size="sm" />
            <PlayingCard card={card('K', '♠')} size="sm" className="ml-1" />
            {Array.from({ length: 7 }, (_, i) => (
              <PlayingCard key={i} size="sm" faceDown className={i === 0 ? 'ml-3.5' : '-ml-5'} />
            ))}
          </div>
          <Button variant="secondary" className="justify-between">
            <span>Reveal hidden tell</span>
            <span className="font-mono text-[13px] text-warn">+1:00</span>
          </Button>
          <Button onClick={() => setSheetOpen(false)}>Done</Button>
        </div>
      </Sheet>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{title}</h2>
      {children}
    </section>
  )
}
