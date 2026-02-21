# Tien Len Daily — Game Design Plan

## Overview

A daily puzzle game based on Tien Len (Thirteen), a Vietnamese card-shedding game. Each day,
all players receive the same fixed board state and compete to finish as high as possible as fast
as possible. Results are shareable via a post-game modal, similar to Wordle.

---

## Core Rules of Tien Len

### Card Ranking (low → high)
`3 4 5 6 7 8 9 10 J Q K A 2`

Suits (low → high): `♠ ♣ ♦ ♥`

When comparing same-rank cards the suit is the tiebreaker (e.g. 3♥ beats 3♦).

### Valid Plays

| Type | Description |
|------|-------------|
| Single | One card |
| Pair | Two cards of the same rank |
| Triple | Three cards of the same rank |
| Sequence | 3+ consecutive ranks (no 2s), same or mixed suits |
| Sequence of Pairs | 3+ consecutive pairs (no 2s) |
| Four of a Kind | Four cards of the same rank — beats any 2 |
| Double Sequence (Tứ Quý chặn) | 3 consecutive pairs — beats a single 2 |

### Turn Structure

- Active player must beat the current highest play with the **same type and same count** (except bombs).
- Any player may pass; play continues until all others pass, then the last player to play leads a new round.
- Note that if a player has passed, they cannot re-enter the current round until the next round starts with a new lead. They can only play again after the current round ends and a new one begins.
- Players are required to play the same play type as the current highest play (e.g. if the current play is a pair, you must also play a higher pair to beat it), except when using bombs against a single 2.
- A player with no valid move **must** pass.  But passing allowed if you have a valid move as well. 
- **Bombs** (four-of-a-kind, or 3+ consecutive pairs) can beat a single 2.

### Win Condition

Shed all cards. Finish order: 1st (Nhất), 2nd (Nhì), 3rd (Ba), 4th (Bét).

---

## Daily Puzzle Concept

### What Makes It "Daily"

- A **seed** (date string, e.g. `2026-02-20`) deterministically generates a fixed 4-player deal.
- All players start from the **same hand** (the puzzle hand) and play against 3 simulated opponents.
- The board is the same for every player worldwide that day — identical to Wordle's shared daily word.
- A puzzle is only accessible for **24 hours** from its date. Navigating to an expired puzzle URL
  shows an expired screen rather than the game.

### Turn Order

Turn order follows standard Tien Len rules: **whoever holds 3♠ leads the first round**. The daily
seed determines which of the four hands receives 3♠, so the player's seat in the rotation varies
by day — they may go first, second, third, or fourth depending on the deal.

Seat positions 1–4 are assigned by the seeded deal. The player is always `hands[0]`; their seat
number is simply determined by which position in the deal received 3♠.

### Ranking Formula

Primary rank: **finish position** (lower is better — 1st > 2nd > 3rd > 4th).
Tiebreaker: **elapsed time** (seconds from first move to final card played, lower is better).

```
score = (finish_position, elapsed_seconds)
```

Example: finishing 1st in 5 minutes beats finishing 1st in 3 minutes **only** if both players
achieved 1st place. Finishing 1st in 10 minutes still beats finishing 2nd in 30 seconds.

### Shareable Result (Wordle-style)

```
Tien Len Daily #42 🃏
Finished: 1st 🥇
Time: 3:42
Moves: 11

♥ ♦ ♠ ♣ ♥ ♦
```

---

## Technical Architecture

### Stack (proposed)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React + TypeScript | Component model fits card UI |
| Styling | Tailwind CSS | Rapid UI iteration |
| State | Zustand or Redux Toolkit | Predictable game state |
| Backend | Node.js / Hono (or Next.js API routes) | Lightweight, containerizable |
| Auth | Anonymous session ID | Low-friction entry |
| Hosting | Mac Mini (self-hosted) via Docker | Full control, no cloud costs |
| Reverse Proxy | Nginx (Docker container) | TLS termination, static asset serving |
| Container Orchestration | Docker Compose | Simple multi-container management |

### Docker Infrastructure

All services run as containers managed by Docker Compose on the Mac Mini.

```
┌─────────────────────────────────────────┐
│  Mac Mini                               │
│                                         │
│  ┌──────────┐    ┌──────────────────┐   │
│  │  Nginx   │───▶│  app (Node/Hono) │   │
│  │ :80/:443 │    │  :3000           │   │
│  └──────────┘    └──────────────────┘   │
│       │                                 │
│       └──▶ /static (built React SPA)    │
└─────────────────────────────────────────┘
```

**`docker-compose.yml` outline:**
```yaml
services:
  app:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro   # TLS certs (e.g. via Let's Encrypt / Certbot)
      - ./dist:/usr/share/nginx/html:ro  # built React SPA
    depends_on:
      - app
```

**TLS:** Use Certbot (via `certbot/certbot` Docker image) with a DNS or HTTP-01 challenge against
your domain. Certs auto-renew via a cron job or a Certbot companion container.

**Deployment:** A simple deploy script pulls the latest build, runs `docker compose up -d --build`,
and Nginx serves the new static bundle with zero-downtime restart of the app container.

### Seeded Deal Generation

```ts
// Pseudocode
function getDailyDeal(dateString: string): Deal {
  let attempt = 0;
  while (true) {
    const seed = hashDate(dateString, attempt); // attempt suffix makes each skip deterministic
    const deck = buildDeck();                   // 52 cards
    const shuffled = seededShuffle(deck, seed);
    const hands = deal(shuffled, 4);            // 4 hands of 13 cards
    if (!anyHandIsInstantWin(hands)) return hands;
    attempt++;                                  // skip and try next seed
  }
}
```

The puzzle hand is always `hands[0]`. Opponents are simulated by a bot engine.

### Instant Win Exclusion

A deal is rejected and the next seed attempted if **any** of the four hands satisfies either
condition below. This applies to all hands, not just the player's, since an opponent instant-win
trivially ends the game before the player can meaningfully play.

| Condition | Definition |
|-----------|------------|
| Dragon (Rồng) | Hand contains a complete straight from 3 to A (all 12 ranks: 3 4 5 6 7 8 9 10 J Q K A, any suits) |
| Four 2s | Hand contains all four 2s |

```ts
function anyHandIsInstantWin(hands: Hand[]): boolean {
  return hands.some(hand =>
    hasDragon(hand) || hasFourTwos(hand)
  );
}

function hasDragon(hand: Hand): boolean {
  const ranks = new Set(hand.map(c => c.rank));
  return ['3','4','5','6','7','8','9','10','J','Q','K','A'].every(r => ranks.has(r));
}

function hasFourTwos(hand: Hand): boolean {
  return hand.filter(c => c.rank === '2').length === 4;
}
```

Skipping is rare in practice — the probability of a dragon in any single hand is approximately
1 in 158,000, and four 2s in one hand is approximately 1 in 1,100. Most dates will resolve on
`attempt = 0`.

### Bot AI (Opponents)

Bots are rule-based engines constrained by **tells** — behavioral quirks assigned deterministically
from the daily seed. Each bot gets 2- tells from a pool of 6; Bots can share tells.

Players will be told which tells are used for the daily game during play and how many there are.

When the player finishes the game, the full set of tells for each bot is revealed.

See [bot-tells.md](./bot-tells.md) for the full tell catalog, assignment algorithm, conflict
resolution priority, and player exposure mechanics.

### Results Modal & Sharing

When the game ends, a modal appears over the board with the player's result and a share button.
Clicking share copies a pre-formatted text block to the clipboard — no backend required.

**Modal contents:**
- Finish position (1st / 2nd / 3rd / 4th) with medal emoji
- Elapsed time (e.g. `3:42`)
- Move count
- A "Share" button

**Copied text format:**
```
Tien Len Daily #42 🃏
Finished: 1st 🥇
Time: 3:42
Moves: 11
https://tienlendaily.com/2026-02-20
```

The URL encodes the puzzle date so anyone who taps the link plays the same deal.

---

## User Experience Flow

```
Begin screen  ← player lands here
  ├─ Puzzle number + date
  ├─ Brief one-paragraph rules summary
  ├─ "Your opponents have tells — watch them carefully"
  └─ "Play" button
       └─ Game screen
            ├─ Bot 1 hand (face-down card count)
            ├─ Bot 2 hand (face-down card count)
            ├─ Bot 3 hand (face-down card count)
            ├─ Your hand (13 cards, face-up, sorted)
            │    (turn order determined by who holds 3♠ — may be any seat)
            ├─ Play area (current combo on table)
            ├─ Bot tell badges (revealed as tells are observed)
            ├─ Timer (starts when the first bot plays its opening card)
            └─ On game end → Results modal (overlay)
                 ├─ Finish position + medal
                 ├─ Elapsed time
                 ├─ Move count
                 └─ Share button → copies result text + puzzle URL to clipboard
```

### Begin Screen

The begin screen is shown every time the player navigates to the page before a game is in progress.
It does **not** start the timer or deal cards — it is purely informational.

Contents:
- **Puzzle identity**: "Tien Len Daily #42 — February 20, 2026"
- **Rules summary**: 2–3 sentences covering card ranking, valid plays, and the goal
- **Tell hint**: a single line reminding the player that bots have observable behavioral patterns
- **Play button**: transitions to the game screen and begins bot turn 1 immediately

The begin screen reappears if the player refreshes before completing the game. Once the game is
finished, navigating back shows the results modal instead.

---

## Milestones

### Phase 1 — Playable MVP
- [ ] Card model, deck, deal logic
- [ ] Tien Len rule engine (valid move validation)
- [ ] Single-player UI (play vs 3 simple bots)
- [ ] Timer + finish detection
- [ ] Seeded daily deal

### Phase 2 — Results & Sharing
- [ ] Results modal (finish position, time, move count)
- [ ] Share button — clipboard copy of result text + puzzle URL

### Phase 3 — Polish
- [ ] Card animations
- [ ] Hint system (optional — penalizes time or adds offset)
- [ ] Mobile-responsive layout
- [ ] Puzzle availability window — a puzzle URL is only playable for 24 hours from its date; requests outside that window show an expired screen

### Phase 4 — Growth
- [ ] Streaks and personal stats
- [ ] Leaderboards
- [ ] Social media integration (share results to Twitter, etc.)

---

## Open Questions

- **Bot strength**: Should bots scale with day-of-week (harder on weekends)?
- **Hint penalty**: If hints are allowed, how much time (or position) is added as penalty?
- **Variants**: Support Southern (standard) vs Northern rules (different bomb rules)?
