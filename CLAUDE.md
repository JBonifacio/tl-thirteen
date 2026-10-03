# Tien Len Daily

A daily Tien Len (Thirteen) card puzzle. Everyone gets the same seeded deal each day: you plus three bots (Lan, Minh, Tuấn). Shed your cards first, in as few moves as possible, then share the result.

## Commands

```bash
npm run dev      # Vite dev server at http://localhost:5173 (?d=YYYY-MM-DD loads a specific day)
npm run build    # tsc + vite build — the main correctness check (no test suite yet)
npm run preview  # serve the production build
```

The leaderboard API lives in `server/` (Express + SQLite) and runs separately; see `README.md` for Docker and deploy steps.

## Code map

- `src/game/` — pure game logic, no React. `cards.ts` (ranks, suits, ordering), `moves.ts` (classify, beat, validate), `bot.ts` (bot turns, share text), `tells.ts` (bot behavior tells), `deal.ts` (seeded deal), `session.ts` (localStorage), `api.ts` (leaderboard), `puzzle.ts` (dates, formatting).
- `src/store/gameStore.ts` — the Zustand store. All game flow runs through it.
- `src/components/` — React UI, styled with Tailwind.
- Seats: 0 = the player ("You"), 1 = Lan, 2 = Minh, 3 = Tuấn. Bots are indexed 0–2 (`botOffset`) in tell and reveal arrays.

## Conventions

- Components are PascalCase `.tsx` files with named exports; props interfaces are named `Props`.
- Store internals start with an underscore (`_applyPlay`). Module constants use UPPER_SNAKE_CASE.
- Section dividers in logic files look like `// ── helpers ─────`.
- 2-space indent, no semicolons, single quotes.
- localStorage is the only client persistence. Keys follow `tl_<thing>_<date>`.
- Bot turns are paced by `BOT_DELAY_MS` (900ms). Don't do work on the render path that would slow the game loop.
- No new frameworks. Keep to React, Zustand, Tailwind and TypeScript, and ask before adding a dependency.

## How we plan and ship work

We use Claude Code's built-in planning. The older GSD `.planning/` folder is retired.

1. **The plan lives in `plans/<feature>.md`.** It is a tracked file that holds the goal, decisions, phases, and a checklist for each phase. Update its checkboxes and decisions as work lands, so it stays the single source of truth.
2. **Each phase starts in plan mode.** Read the phase in the plan doc, look at the code it touches, then present a concrete change list for approval before editing.
3. **Each phase ends verified.** `npm run build` passes, the app has been run and the changed screens checked in light and dark mode at phone width (390px) and desktop width, and the phase's acceptance checks are ticked.
4. **One commit or PR per phase,** with a message that names the phase. Commit only when asked.
5. **New ideas found mid-phase go into the plan doc's "Later" list,** not into the current change.

Design source for the UI redesign: the Claude Design canvas "Tien Len Daily Redesign" (https://claude.ai/artifact/M2D4FRPzQ3dnx3o6WbKLut). Read it with the Artifact tool when exact values are needed.
