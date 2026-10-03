import { useSyncExternalStore } from 'react'

export type ThemePref = 'system' | 'light' | 'dark'

const THEME_KEY = 'tl_theme'
const THEME_COLORS = { light: '#F5F6F7', dark: '#0F1114' }
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

const listeners = new Set<() => void>()

// ── storage ───────────────────────────────────────────────────────────────────

export function getThemePref(): ThemePref {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    return raw === 'light' || raw === 'dark' ? raw : 'system'
  } catch {
    return 'system'
  }
}

export function setThemePref(pref: ThemePref): void {
  try {
    if (pref === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, pref)
  } catch {
    // Storage unavailable (private mode etc.) — still apply for this session
  }
  applyTheme(pref)
  listeners.forEach(fn => fn())
}

// ── applying ──────────────────────────────────────────────────────────────────

/** Toggles the .dark class on <html>. Mirrors public/theme-init.js. */
export function applyTheme(pref: ThemePref = getThemePref()): void {
  const dark = pref === 'dark' || (pref === 'system' && darkQuery().matches)
  document.documentElement.classList.toggle('dark', dark)

  // The two media-scoped theme-color metas follow the OS; when the player
  // overrides, point both at the chosen theme so the browser chrome matches.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
    const scheme = meta.media.includes('dark') ? 'dark' : 'light'
    meta.content = pref === 'system' ? THEME_COLORS[scheme] : THEME_COLORS[pref]
  })
}

/** Call once at startup: applies the theme and follows OS changes while on 'system'. */
export function initTheme(): void {
  applyTheme()
  darkQuery().addEventListener('change', () => {
    if (getThemePref() === 'system') applyTheme('system')
  })
}

// ── React hook ────────────────────────────────────────────────────────────────

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useThemePref(): [ThemePref, (pref: ThemePref) => void] {
  const pref = useSyncExternalStore(subscribe, getThemePref, () => 'system' as ThemePref)
  return [pref, setThemePref]
}
