import { ThemePref, useThemePref } from '../theme'

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function ThemeSwitch() {
  const [theme, setTheme] = useThemePref()

  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 p-1 rounded-full bg-chip">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={`h-10 px-4 rounded-full text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
            theme === value ? 'bg-surface text-ink shadow-sm shadow-shadow/10' : 'text-muted hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
