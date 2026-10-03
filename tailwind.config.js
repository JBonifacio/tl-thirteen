/** @type {import('tailwindcss').Config} */

// Theme tokens live as RGB channels in src/index.css (:root = light, .dark = dark)
const token = name => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        'card-line': token('card-line'),
        chip: token('chip'),
        'card-face': token('card-face'),
        warn: token('warn'),
        accent: {
          DEFAULT: token('accent'),
          text: token('accent-text'),
        },
        'on-accent': token('on-accent'),
        suit: {
          spade: token('suit-spade'),
          heart: token('suit-heart'),
          diamond: token('suit-diamond'),
          club: token('suit-club'),
        },
        back: {
          DEFAULT: token('back'),
          stripe: token('back-stripe'),
          edge: token('back-edge'),
        },
        shadow: token('shadow'),
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
