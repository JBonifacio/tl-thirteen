# UI Redesign — minimal, mobile-first, light and dark

**Status:** In progress — Phases 1–4 done, Phase 5 next
**Design:** [Claude Design canvas](https://claude.ai/artifact/M2D4FRPzQ3dnx3o6WbKLut). This has 18 artboards: each screen in light and dark, plus a desktop Game screen, an invalid-selection state, and 1st-place Results.
**Goal:** Replace the green felt-table look with a calm, minimal interface that works first on a phone, supports dark mode, and makes opponent information readable at a glance. Add the new behaviors the design introduced: explaining invalid plays, native sharing, and 1st-place confetti.

Phases 1–8 change no game rules, bot logic, scoring, leaderboard or replay data. Phase 9 is a security audit that may change how the leaderboard API accepts scores. Only presentation changes, plus the small additions listed under each phase.

---

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Light/dark | Follow the device setting by default, with a System / Light / Dark switch in the header menu, saved as `tl_theme` | Best default, and players can still override it. Confirmed 2026-10-02. |
| Rollout | Phased, one PR per phase. The game stays playable between phases | Keeps each review small. Old and new styles coexist briefly. |
| Theming | CSS variables on `:root` and `.dark`, mapped into Tailwind as named colors (`bg-surface`, `text-muted`, `text-suit-heart`…) | One place to change colors. Dark mode needs no `dark:` duplicates. |
| Fonts | Geist and Geist Mono hosted on our own site: the `woff2` files in `public/fonts/` plus `@font-face` rules in `index.css` | The nginx Content-Security-Policy only allows fonts and styles from our own site (`'self'`), so Google Fonts would be blocked. Self-hosting also adds no npm dependency and no third-party requests. |
| Suit colors | Four colors: ♠ ink, ♥ red, ♦ blue, ♣ green, with a separate set for dark mode | Accessibility. Every suit is distinct by color and by shape. |
| Accent | Green. Light `#0F7B5C`; dark `#17805A` for fills and `#3FC68A` for text | User choice. Dark mode uses a darker fill with white text and a brighter green for small text so both stay readable. |
| Card backs | Navy diagonal stripes. Light `#34507F`/`#3F5E92` with outline `#D5DAE0`; dark `#22385E`/`#2B4472` with outline `#8C96A4` | User choice. The light outline makes overlapped backs countable. |
| Opponent info | No card counts. A fan of card backs, with revealed cards face up on the left and marked cards face up in place | Closer to glancing across a real table |
| Confetti | Pure CSS keyframes, no library. Skipped when reduced motion is on | No new dependency |
| Desktop | Only the Game screen gets its own desktop layout (from 1024px). Other screens are a centered 420px column, and Leaderboard and Replay open as centered pop-up windows | Those screens are single-column anyway |
| Passing rule (fixed in Phase 2) | A pass lasts until the round ends. Exception: on a single 2, a player who passed may bomb back in (once per 2 played). | The code was clearing passes on every play (`gameStore.ts`), which contradicted `game-design.md`. The user confirmed the rule, with bombs beating a single 2 only. |

## Design tokens

Copy these exactly from the canvas.

| Token | Light | Dark |
|---|---|---|
| bg | `#F5F6F7` | `#0F1114` |
| surface | `#FFFFFF` | `#171A1F` |
| ink | `#111418` | `#EDEFF2` |
| muted | `#5B636E` | `#9AA3AE` |
| line | `#E4E7EB` | `#262B32` |
| card-line | `#D5DAE0` | `#363C45` |
| chip | `#EEF0F2` | `#242930` |
| card-face | `#FFFFFF` | `#1E2228` |
| warn | `#B45309` | `#F0A050` |
| suit ♠ / ♥ / ♦ / ♣ | `#111418` / `#C8312A` / `#1F5FD1` / `#157A3E` | `#EDEFF2` / `#FF6B61` / `#6EA0FF` / `#4CC97F` |
| accent / on-accent / accent-text | `#0F7B5C` / `#FFFFFF` / `#0F7B5C` | `#17805A` / `#FFFFFF` / `#3FC68A` |

Radii are 8–10px for cards, 14px for buttons and tiles, 16px for panels, and 24px for the tops of sheets. Touch targets are at least 44px. Line icons replace emoji throughout.

---

## Phase 1 — Foundation: tokens, theme, shared pieces ✅

Nothing looks different yet except the font and page colors. Everything after this builds on it.

- [x] Add the CSS variables for both themes to `src/index.css` (on `:root` and `.dark`) and map them to Tailwind colors in `tailwind.config.js`, with `darkMode: 'class'`.
- [x] Self-host Geist (400/500/600) and Geist Mono (500) as `woff2` files in `public/fonts/`, with `@font-face` (`font-display: swap`) in `index.css` and a `<link rel="preload">` for the main weight. Add a `theme-color` meta for each scheme and set the font stacks in Tailwind. No CSP change is needed.
- [x] Add `src/theme.ts` (outside `src/game/`, which stays React-free) with `getThemePref` and `setThemePref` (`'system' | 'light' | 'dark'`, saved in `tl_theme`). Apply the `.dark` class and follow the device setting live. Run it before React renders to avoid a light flash.
- [x] Add `src/game/players.ts` with `SEAT_NAMES` and `BOT_NAMES`. Remove the five duplicated copies (BotPanel, PlayArea, RecentPlays, ReplayModal, ResultsModal), which clears the tech debt noted in v1.1.
- [x] Rewrite `CardComponent.tsx` as a single card component, named `PlayingCard` because `Card` is already the card type in `cards.ts`, with `size` (`xs` 26×38, `sm` 34×50, `md` 48×72, `lg` 64×92, `xl` 88×126), `faceDown`, `selected`, `tone` (`accent | warn` for the selection outline), and `marked`. It uses the four-color suits and the striped navy back.
- [x] Add `src/components/ui/`: `Button` (primary, secondary and ghost; 52–56px tall), `IconButton` (44px), `Sheet` (a bottom sheet on mobile, a centered pop-up window from 1024px; closes on Escape and backdrop click; keeps keyboard focus inside), and `Icon`, a small set of inline stroke SVGs (help, close, copy, share, replay, chart, eye, lock, check, alert, clock, chevron).

**Done when:** the build passes; the app runs with Geist on the new background in both themes; the theme setting survives a reload; no `BOT_NAMES` or `SEAT_NAMES` arrays remain in components.

**Shipped notes (2026-10-02):**
- The before-paint theme script is `public/theme-init.js`, an external file because the CSP blocks inline scripts.
- Added a favicon (`public/cards.svg`); the old link pointed at a file that didn't exist.
- Added a dev-only gallery at `?preview` (`src/dev/UiPreview.tsx`), which is left out of production builds.
- Cards are `relative` so a lifted card doesn't hide its neighbour's corner.
- Verified with headless Chrome at 390px and 1280px in both themes: the sheet's focus, Escape, backdrop and focus-return behaviour, the theme setting persisting and following the system, fonts self-hosted with no third-party requests, the game starting and playing, and no console errors.

## Phase 2 — Game screen (mobile) ✅

Matches the artboards "Game · your turn" and "Opponent sheet".

- [x] Rebuild `GameScreen.tsx` as a single column: a header (title, puzzle number and date, timer pill, help button), three opponent rows, the table, a one-line recent-plays strip, and the hand panel.
- [x] Replace `BotPanel.tsx` with `OpponentRow.tsx`: name, a "Passed" or finished label, two tell dots, and the card fan (revealed cards face up first, then backs overlapped to show 12px each, with marked cards face up in place in the accent outline). The whole row is a button that opens the opponent sheet. Show no card counts. The accessible label includes the count for screen readers.
- [x] Add `OpponentSheet.tsx` (built on `Sheet`): their hand at `sm` size with the "Revealed by a tell / Unknown" key, a tells list (confirmed with a check, hidden with a lock), the "Reveal hidden tell +1:00" button wired to `revealHint`, and today's tells for all bots (from `getTellPool`). This replaces `TellHUD.tsx` on mobile.
- [x] Restyle `PlayArea.tsx`: "{who} played {combo}", cards at `lg` size, a hint line below, and an empty state for leading.
- [x] Restyle `RecentPlays.tsx` as the single-line strip, newest first, with colored card text.
- [x] Restyle `Hand.tsx`: cards at `md` size overlapped by 20px, lifting 14px when selected; a "Your turn" pill and a selected count; Pass (1 part) and Play (2 parts) buttons; a quiet "Waiting for Lan…" state when it isn't your turn.
- [x] Restyle `Timer.tsx` as the pill.
- [x] Bots that have finished show their place in the row instead of the fan.
- [x] The header help button opens a "How to play" sheet (`HelpSheet.tsx`) with the three rule steps and the System / Light / Dark switch (`ThemeSwitch.tsx`). *Moved here from Phase 5.*

**Done when:** a full game can be played at 390px in both themes with no horizontal scrolling, and opponent rows, the sheet, revealing a tell and selecting cards all work.

**Shipped notes (2026-10-02):**
- `BotPanel.tsx` and `TellHUD.tsx` are deleted.
- `CardFan.tsx` lays out opponent fans and squeezes revealed spacing, then backs, then the gap so a fan always fits its row; the hand and table use the same `fitStep` so 13 cards fit at 375px.
- `moves.ts` gained label helpers only (`moveName`, `moveNameWithArticle`); no rule changes.
- The opponent name column is 96px so "Tuấn Playing…" isn't truncated.
- Verified with headless Chrome at 390×844 and 375×667 in light and dark: opponent fans and the hand fit, names and status labels aren't clipped, no horizontal scroll, the help sheet and its theme switch, the opponent sheet (fits the viewport, reveal tell updates the count, lock list and row dots, closes on Escape), the "Waiting for…", "Playing…" and "Passed" labels, and a full game played through the UI to the results screen at both sizes, with no console errors.

## Phase 3 — Invalid-play feedback (new)

Matches "Game · invalid selection". Today Play just greys out. Worse, a first play without 3♠ leaves Play enabled and silently does nothing (`gameStore.ts:279`).

- [x] Add `explainInvalidPlay(cards, currentTrick, { mustInclude3S, lastPlayedBy, hasPassed })` to `src/game/moves.ts`. It returns `null` when the play is legal, otherwise one short sentence:
  - First play without 3♠: "Your first play must include 3♠."
  - Not a real combination: "That's not a valid combination."
  - Leading with a bomb: "Bombs can only be played on a single 2."
  - Passed this round and the selection isn't a bomb on a single 2: "You passed — only a bomb brings you back."
  - Wrong type or size: "Minh played a pair — play a pair to beat it." (also for straight lengths: "…a 5-card straight…")
  - Right type but not high enough: "Your pair has to beat 6♣ 6♦."
- [x] In `Hand.tsx`, base `canPlay` on the same check (so the first-play rule disables Play too). While the selection is invalid, outline the selected cards in amber and show the message above the buttons with `role="status"`. With nothing selected, show no message. The button reads "Select cards", "Play" (when invalid) or "Play pair" (when valid).
- [x] The `playerPlay` guards in the store stay as a backstop.

**Done when:** each case above shows its message, the cards and button reset once the selection is fixed, and screen readers announce the message.

**Shipped notes (2026-10-02):**
- Verified logic against 20,000 randomized selections to ensure parity with `gameStore` guards.
- Verified with headless Chrome at 390x844 and 375x667 in light and dark: the amber warning outline, play button disabled state, explanation string, and that the `role="status"` slot prevents layout shift.

## Phase 4 — Game screen (desktop)

Matches "Game · desktop". From 1024px only. Below that, the Phase 2 layout applies.

- [x] Use a two-column layout up to 1280px wide: the main area and a 280px sidebar that drops below the main area on narrower windows.
- [x] Main area: opponent cards in a three-column grid (`sm` cards, tells in the card header), the table with `xl` cards, and the hand panel with `lg` cards and Pass and Play to the right.
- [x] Sidebar: a Recent plays list (rows with card chips) and "Tells in play today".
- [x] Clicking an opponent opens the opponent sheet as a pop-up window.
- [x] Raise the `playLog` cap from 3 to 8 in `gameStore.ts` (lines 392 and 447). The mobile strip still shows only the latest 3.

**Done when:** at 1280px and 1024px the screen matches the canvas in both themes, and resizing to phone width switches cleanly to the mobile layout.

**Shipped notes (2026-10-03):**
- Added `useMediaQuery` hook for cleanly responding to the `1024px` breakpoint via JS so the right card `size` enum is passed to `PlayingCard` and `CardFan`.
- Implemented CSS Grid structure in `GameScreen` with the new sidebar for desktop.
- Verified desktop rendering across light and dark modes via headless browser screenshots.

## Phase 5 — Start and expired screens

Matches "Start".

- [ ] Restyle `BeginScreen.tsx`: the four-color suit mark, a 44px title, "Daily #N · weekday, month day", three numbered rule steps, the "Watch the bots" note, the scoring line, and the Play button pinned to the bottom.
- [ ] Restyle `ExpiredScreen` in `App.tsx` the same way, with a clock icon instead of emoji and a "Play today's puzzle" button. *Not drawn — extend the Start style.*

## Phase 6 — Results, sharing and confetti

Matches "Results" and "Results · 1st place". The rules from the retry work (v1.0) still hold: a retry shows "Retry #N" and hides Share, Leaderboard, Replay and the countdown.

- [ ] Rebuild `ResultsModal.tsx` as a full screen on mobile and a centered 420px window on desktop: the large place number with its suffix, "Finished 2nd of 4", Moves / Time / Hint penalty tiles (the penalty tile in amber, shown only when there's a penalty), the next-puzzle countdown, a "What you'll share" preview, Share result plus a Copy button, Replay / Leaderboard / Bot tells tiles, and Play again.
- [ ] Sharing (new): split `buildShareText` in `bot.ts` into `buildShareParts()` → `{ title, text, url }` and keep `buildShareText()` as the copy version (text plus link). Share result calls `navigator.share({ title, text, url })` when `navigator.canShare?.(...)` allows it, and does nothing if the player cancels. Otherwise it copies and shows "Copied". The Copy button always copies. A clipboard failure shows an inline message.
- [ ] Confetti (new): `Confetti.tsx` with about 56 pieces made of CSS keyframes, in the suit colors plus gold and the accent. It plays once when `playerFinishPosition === 1` (including retries), sits above the content without blocking taps, removes itself after about 3.5 seconds, and doesn't show when reduced motion is on.
- [ ] Rebuild the Bot Reveals pop-up on `Sheet` in the opponent-sheet style. *Not drawn.*

**Done when:** places 1–4 and the retry variant render correctly; Share opens the native share menu on a phone (iOS Safari and Android Chrome) and copies on desktop; confetti plays once, only for 1st place.

## Phase 7 — Leaderboard and replay

Matches "Leaderboard" and "Replay".

- [ ] Rebuild `LeaderboardModal.tsx` on `Sheet`: a header with the player count, a "Your rank" card in the accent tint, and a table (# / Player / Place / Moves / Time) using text places ("1st") instead of medal emoji, with your row highlighted. Restyle the nickname form to match: a labelled input, an inline error in warn color, and a primary Submit button. *The nickname form isn't drawn.*
- [ ] Rebuild `ReplayModal.tsx` on `Sheet`: round headers, number / name / card-chip rows in suit colors, muted Pass and Skipped rows, and a Copy replay button. The copied text format stays the same.

## Phase 8 — Polish and cleanup

- [ ] Remove leftover `green-9xx`, `yellow-*` and emoji UI.
- [ ] Accessibility pass: everything works with the keyboard, focus outlines are visible, icon-only buttons have `aria-label`, contrast is checked in both themes, and opponent rows and cards have labels.
- [ ] Respect reduced motion for the card-lift and sheet animations as well as confetti.
- [ ] Do a real-device check on iOS Safari and Android Chrome, including safe-area padding under the hand panel and the share menu.
- [ ] Update `README.md` screenshots and description.

## Phase 9 — Security audit

This is a full review before calling the redesign done. It covers the redesign's own changes and the existing app: the client, the leaderboard API, nginx, Docker and the Cloudflare tunnel. Run `/security-review` on the redesign branch first, then work through the checklist. The rule for findings: fix Critical and High in this phase, record Medium and Low with a decision (fix now, fix later, or accept), and write the results under "Audit results" below.

**Already known.** These were found while writing this plan on 2026-10-02. Confirm each one, then fix it. By the user's decision on 2026-10-02, these stay in Phase 9 rather than being fixed early.

| # | Finding | Severity | Where |
|---|---|---|---|
| K1 | **Anyone can overwrite anyone's score.** `POST /api/scores` does an upsert (`ON CONFLICT … DO UPDATE`) on date + nickname with no proof of ownership, so submitting with someone else's nickname replaces their entry. | High | `server/src/routes/leaderboard.ts` |
| K2 | **Scores are fully trusted from the client.** Any request can claim 1st place in 1 move and 0ms. There is no check that a real game was played. | High (integrity) | same |
| K3 | **There is no rate limit** on score submissions or leaderboard reads. | Medium | `server/src/index.ts`, `nginx.conf` |
| K4 | **Server dependencies have known vulnerabilities:** `path-to-regexp` (high, ReDoS), `body-parser` and `qs` (DoS). `npm audit fix` resolves them. The frontend has 0 vulnerabilities. | High | `server/package-lock.json` |
| K5 | **The ranking ignores hint penalties.** Results are ordered by `elapsed_ms` only, while the share text adds the penalty, so a revealed tell costs nothing on the leaderboard. | Medium (integrity) | `getLeaderboard()` |
| K6 | **Both containers run as root,** and image tags are unpinned (`cloudflared:latest`, `node:22-alpine`, `nginx:alpine`). | Medium | `Dockerfile`, `server/Dockerfile`, `docker-compose.yml` |
| K7 | **Express sends `X-Powered-By`,** and nginx sends its version (`server_tokens` is on). | Low | `server/src/index.ts`, `nginx.conf` |

**Proposed direction for K1, K2 and K5.** Decide this together before fixing.
- K1: when a score is first submitted, return a random per-player token. The browser keeps it in localStorage (`tl_player_token`). An update only succeeds with the matching token; otherwise the API returns 409 "nickname taken today". As a simpler fallback, nicknames could be first-come-first-served per day with no updates at all.
- K2: the deal is seeded and deterministic, so the server can replay the game. The client posts the move list it already records for replays, and the server re-simulates it with the shared engine code (`src/game/*`) to work out the real position and move count, then checks that elapsed time is plausible. This is a bigger change, so it may become its own plan. At minimum, add sanity bounds: moves within the theoretical minimum and maximum, and elapsed time at least a few seconds.
- K5: rank by `elapsed_ms + hint_penalty_ms`, and show that total in the leaderboard Time column.

**Checklist**

- [ ] **API input handling.** Check every field on both routes for type, length and range. Set an explicit size limit on `express.json` (around 2kb). Reject unknown fields. Make sure errors never leak stack traces. Confirm all SQL uses bound parameters (it currently does).
- [ ] **Ownership and integrity.** Fix K1, K2 and K5 as agreed.
- [ ] **Abuse limits.** Add rate limiting (K3). Prefer nginx `limit_req` on `/api/`, keyed on Cloudflare's `CF-Connecting-IP` header with `real_ip_header` set to trust only Cloudflare ranges. Cap the number of rows the leaderboard GET returns.
- [ ] **Dependencies.** `npm audit fix` in `server/` (K4), then `npm audit` in both packages showing 0 high or critical. Review `leo-profanity` and `better-sqlite3` versions. Consider adding Dependabot.
- [ ] **HTTP headers.** Check the CSP still holds after the redesign: self-hosted fonts and the `unsafe-inline` styles needed for card and confetti positioning. Add `Permissions-Policy` (camera, microphone and geolocation off) and `server_tokens off`, and remove `X-Powered-By` (K7). Confirm HSTS and `frame-ancestors` behave correctly through Cloudflare. Check that the API's JSON responses carry `nosniff` and a correct content type.
- [ ] **Client.** No `dangerouslySetInnerHTML`, `innerHTML` or `eval` (none today; keep it that way). Nicknames and share text render as plain text. The share and copy flows only use `window.location.origin` and the puzzle date. Nothing sensitive is stored in localStorage. The `?d=` date parameter is validated.
- [ ] **Secrets and repo.** No tunnel credentials, `.env` or `.db` files in git history (none found today). `.gitignore` covers them. No secrets are baked into images.
- [ ] **Containers and deploy.** Run both services as non-root (`USER node`; `nginxinc/nginx-unprivileged` or the equivalent) (K6). Pin image versions or digests. Make the root filesystem read-only where possible, writable only for the API's `/data` volume. Confirm nothing is published on host ports besides the tunnel. Check the tunnel config's catch-all `http_status:404`.
- [ ] **Data.** Plan backups for the `leaderboard-data` volume. Run `purge.ts` on a retention schedule (for example 90 days) so old nicknames don't build up forever.
- [ ] **Re-test.** Re-run `/security-review` and `npm audit`, then manually try K1 and K2 against a local stack (`docker compose up`) to confirm they're closed.

**Done when:** every finding has a severity and a decision; all Critical and High findings are fixed and re-tested; the "Audit results" section below is filled in.

### Audit results

*Fill in during Phase 9: the finding, its severity, the decision, and the commit or PR that fixed it.*

---

## Later

Ideas outside this redesign. Pick them up separately.

- A test runner (Vitest) with unit tests for `explainInvalidPlay` and `buildShareParts`.
- Animated replay playback (REPLAY-09 from v1.1).
- A small opponent "thinking" animation during bot turns.
