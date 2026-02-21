# Tien Len Daily

A daily Tien Len (Thirteen) card puzzle. Everyone gets the same deal each day. Shed your cards as fast as possible and share your result.

## Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS v3
- **State**: Zustand
- **Deployment**: Docker + Nginx on Mac Mini

---

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
```

### Run dev server

```bash
npm run dev
```

Opens at `http://localhost:5173`.

### Build

```bash
npm run build
```

Output goes to `dist/`.

### Preview production build locally

```bash
npm run preview
```

---

## Playing a specific date

Append `?d=YYYY-MM-DD` to the URL to load a specific day's puzzle:

```
http://localhost:5173/?d=2026-02-20
```

Puzzles are only valid for 24 hours from their date. Expired dates show an error screen.

---

## Deployment

This project is deployed using **Cloudflare Tunnels**, which provides secure access without port forwarding or TLS certificate management.

### First-time setup

See [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md) for complete deployment instructions.

**Quick start:**

1. Create configuration from template:
   ```bash
   cp cloudflare-tunnel.yml.template cloudflare-tunnel.yml
   ```

2. Follow the setup guide to obtain your tunnel credentials and configure your domain.

3. Deploy:
   ```bash
   docker compose up -d --build
   ```

**Note:** `cloudflare-tunnel.yml` and `cloudflared-credentials.json` are in `.gitignore` to prevent committing sensitive data.

### Deploy updates

```bash
git pull
docker compose up -d --build
```

The old container keeps serving traffic while the new image builds. Nginx restarts in under a second.

---

## Project structure

```
src/
  game/
    cards.ts          Card model, ranking, suit/rank constants
    deal.ts           Seeded RNG (Mulberry32), deal generation, instant-win exclusion
    moves.ts          Move types, validation, bot move generation
    tells.ts          Tell registry (add new tells here), assignment, filtering
    bot.ts            Bot decision engine, game flow helpers
    puzzle.ts         Date handling, puzzle number, time formatting
  store/
    gameStore.ts      Zustand store — full game loop, bot turn scheduling
  components/
    BeginScreen.tsx   Start screen shown before game begins
    GameScreen.tsx    Main game layout
    Hand.tsx          Player's hand with card selection and play/pass buttons
    BotPanel.tsx      Bot card count, confirmed tells, hint button
    PlayArea.tsx      Current trick on the table
    TellHUD.tsx       Sidebar showing today's active tells
    Timer.tsx         Live elapsed timer
    ResultsModal.tsx  Post-game result, share button, bot tell reveal
plans/
  game-design.md      Full game design document
  bot-tells.md        Tell system design and registry documentation
```

---

## Adding a new tell

Open `src/game/tells.ts` and append a new object to `TELL_REGISTRY`:

```ts
{
  id: 'YOUR_TELL_ID',
  category: 'preservation', // or 'aggression' | 'sequencing' | 'endgame'
  label: 'Short player-facing label',
  description: 'One sentence shown on reveal.',
  priority: 20,             // lower = harder constraint, applied first
  confirmThreshold: 2,      // observations before badge appears
  filter: (candidates, allValid, hand, context) => {
    // Return filtered list of moves.
    // Can remove OR re-add moves from allValid.
    return candidates.filter(/* your logic */)
  },
},
```

That's all. The assignment algorithm, HUD, badge system, and post-game reveal pick it up automatically.

---

## Priority guidelines for new tells

| Range | Meaning |
|-------|---------|
| 1–15 | Hard constraints, never overridden |
| 16–25 | Soft preservation |
| 26–40 | Conditional overrides |
| 41–60 | Compulsion / aggression |
