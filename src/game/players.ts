// Seat 0 is the player; seats 1–3 are the bots (botOffset 0–2 in tell/reveal arrays).
export const SEAT_NAMES = ['You', 'Lan', 'Minh', 'Tuấn'] as const

export const BOT_NAMES = SEAT_NAMES.slice(1)
