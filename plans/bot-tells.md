# Bot Tells System

## Design Goals

1. **Deterministic** — tells are assigned from the daily seed, so replaying the same puzzle produces
   the same three bots with the same behavioral constraints.
2. **Exploitable** — each tell is a genuine strategic leak a player can identify and use.
3. **Shared tells allowed** — multiple bots may share the same tell on a given day, creating
   situations where the player must distinguish *which* bot has it, not just *that* it exists.
4. **Observable** — the player is shown the active tell pool (which tells are in play and how many)
   during the game, but not which bot holds which. Full per-bot assignment is revealed at game end.
5. **Extensible** — adding a new tell requires only adding an entry to the tell registry. No changes
   to the engine, assignment algorithm, or UI wiring are needed.

---

## Tell Registry

Tells are defined in a central registry. Each entry is a self-contained object; the engine
iterates the registry dynamically rather than hardcoding tell IDs anywhere.

### Tell Definition Schema

```ts
type TellCategory = 'preservation' | 'aggression' | 'sequencing' | 'endgame';

interface TellDefinition {
  id: string;                  // unique snake_case key, e.g. 'PRESERVE_PAIRS'
  category: TellCategory;      // groups tells in the UI and for future filtering
  label: string;               // short player-facing name shown in the tell pool HUD
  description: string;         // one-sentence explanation shown on reveal / game end
  priority: number;            // conflict resolution — lower number = higher priority
  filter: MoveFilter;          // pure function; see Move Filtering section below
  confirmThreshold: number;    // number of observable actions before badge is confirmed
}
```

New tells are added by appending a new `TellDefinition` object. Nothing else changes.

### Move Filtering

The engine represents a bot's decision as: given a list of candidate moves, remove any moves the
tell forbids.

```ts
type MoveFilter = (
  candidates: Move[],   // all valid moves the bot could legally make this turn
  hand: Card[],         // bot's current full hand
  context: TurnContext  // current trick, round history, other bots' card counts
) => Move[];            // filtered list — engine picks from whatever remains
```

Each tell's `filter` is a pure function with no side effects. Tells compose by chaining filters:

```ts
function applyTells(tells: TellDefinition[], candidates: Move[], hand, context): Move[] {
  // sort by priority ascending (lower number = applied first / highest authority)
  const ordered = [...tells].sort((a, b) => a.priority - b.priority);
  return ordered.reduce(
    (moves, tell) => tell.filter(moves, hand, context),
    candidates
  );
}
```

If the filter chain reduces candidates to an empty list, the engine falls back to **pass**. This
prevents tells from creating illegal states.

---

## Current Tell Catalog

### Preservation Tells (`category: 'preservation'`)

| ID | Priority | Label | Description |
|----|----------|-------|-------------|
| `PRESERVE_PAIRS` | 20 | "Never breaks a pair" | Will not use one card from a pair as a lone single play. |
| `PRESERVE_TRIPLES` | 10 | "Never breaks three-of-a-kind" | Will not play one or two cards from a triple as singles or pairs. |
| `PRESERVE_STRAIGHTS` | 10 | "Never breaks a straight" | Will not play individual cards out of a formed sequence. |
| `HOARD_TWOS` | 10 | "Never combines 2s" | Only plays 2s as single cards; will not use a 2 in any combination. |

### Aggression Tells (`category: 'aggression'`)

| ID | Priority | Label | Description |
|----|----------|-------|-------------|
| `ALWAYS_BEAT_SINGLE` | 50 | "Always contests singles" | Must play a single if it can beat the current single; never passes on one. |
| `HIGH_SINGLE_BREAKER` | 30 | "Burns high cards as singles" | Will break a pair to play a single of rank 10 or above. Overrides `PRESERVE_PAIRS` (priority 20) because 30 > 20 — applied after, and re-adds the high-card single moves that the preservation filter removed. |

> **Priority note:** lower number = runs earlier in the chain = harder constraint. A tell with
> priority 10 cannot be overridden by one with priority 30. `HIGH_SINGLE_BREAKER` at 30 operates
> after `PRESERVE_PAIRS` at 20, which means it specifically re-admits moves the preservation filter
> excluded — effectively a targeted override rather than a full bypass.

### Conflict Examples

**`PRESERVE_PAIRS` (20) + `ALWAYS_BEAT_SINGLE` (50)**
Trick is a single 8. Bot holds [8♣, 8♥, Q♠].
- Preservation filter (priority 20) removes moves that break the 8-pair → only Q♠ single remains.
- Aggression filter (priority 50) sees Q♠ available and enforces play → bot plays Q♠.

**`PRESERVE_PAIRS` (20) + `HIGH_SINGLE_BREAKER` (30)**
Trick is a single 9. Bot holds [K♠, K♥, 5♣].
- Preservation filter removes K♠ and K♥ singles (would break the pair).
- `HIGH_SINGLE_BREAKER` re-admits K♠ (rank K ≥ 10) → bot plays K♠, breaking the pair.

**`PRESERVE_TRIPLES` (10) + `HIGH_SINGLE_BREAKER` (30)**
Trick is a single 9. Bot holds [K♠, K♥, K♣, 5♣].
- Preservation filter (priority 10) removes all K singles (would break the triple).
- `HIGH_SINGLE_BREAKER` (priority 30) runs after — but `PRESERVE_TRIPLES` has lower priority number
  (10 < 30), meaning it is a harder constraint that the breaker cannot re-open. Bot plays 5♣ or passes.

---

## Tell Assignment

### Rules

- Tells are drawn from the full registry for each daily seed.
- **Bots may share tells** — the same tell can appear on more than one bot.
- Each bot receives **2 tells**, drawn independently.
- Assignment is deterministic from the seed: same date always produces the same bot configurations.
- At least one bot is always assigned `ALWAYS_BEAT_SINGLE` to guarantee an exploitable aggression
  target each day.

### Algorithm

```ts
function assignTells(seed: string, registry: TellDefinition[]): [Tell[], Tell[], Tell[]] {
  const rng = seededRng(seed);
  const ids = registry.map(t => t.id);

  function pickTwo(rng: Rng): string[] {
    // weighted random draw with replacement — bots can share tells
    const a = weightedPick(ids, rng);
    const b = weightedPick(ids, rng);
    return [a, b];
  }

  let botA = pickTwo(rng);
  let botB = pickTwo(rng);
  let botC = pickTwo(rng);

  // Guarantee: at least one bot has ALWAYS_BEAT_SINGLE
  const allAssigned = [...botA, ...botB, ...botC];
  if (!allAssigned.includes('ALWAYS_BEAT_SINGLE')) {
    // Replace a random tell in a random bot with ALWAYS_BEAT_SINGLE
    const target = seededChoice(['botA', 'botB', 'botC'], rng);
    const slot = seededChoice([0, 1], rng);
    ({ botA, botB, botC }[target])[slot] = 'ALWAYS_BEAT_SINGLE';
  }

  return [botA, botB, botC].map(ids => ids.map(id => registry.find(t => t.id === id)));
}
```

---

## Tell Exposure to the Player

### During Play — Tell Pool HUD

The player sees a HUD panel showing:
- **Which tells are active today** (the union of all tells assigned across all three bots), by label
- **How many bots** share each tell (e.g. "×2" if two bots have it)
- Tells are listed from the start of the game — the puzzle is about deducing *who* has *which*

Example HUD:
```
Today's tells in play:
  Never breaks a pair        ×2
  Always contests singles    ×1
  Never breaks a straight    ×1
  Burns high cards as singles ×1
```

### During Play — Confirmation Badges

After a bot demonstrably acts on a tell, a confirmation badge appears on that bot's panel. The
`confirmThreshold` field on each tell defines how many observed instances trigger the badge.

```
┌──────────────────────────────────┐
│  Bot B  (4 cards left)           │
│                                  │
│  Confirmed tells:                │
│  ✓ Never breaks a pair           │
│  ✓ Always contests singles       │
└──────────────────────────────────┘
```

Badges are additive — once confirmed, a tell is never un-confirmed.

### Optional Reveal (Hint Penalty)

A player may tap "Reveal a Tell" to immediately confirm one unconfirmed tell for a chosen bot.
Penalty: **+60 seconds** added to elapsed time, shown in the share output:

```
Tien Len Daily #42 🃏
Finished: 1st 🥇
Time: 3:42 (+1:00 hint)
Moves: 11
https://tienlendaily.com/2026-02-20
```

### Post-Game — Full Reveal

When the results modal opens, the full per-bot tell assignment is revealed:

```
Bot A — Never breaks three-of-a-kind · Burns high cards as singles
Bot B — Never breaks a pair · Always contests singles
Bot C — Never breaks a pair · Never combines 2s
```

This gives the player a debrief to understand where they missed or correctly exploited a tell.

---

## Adding a New Tell

1. Define a new `TellDefinition` object in the registry file with a unique `id`, appropriate
   `category`, `priority`, `label`, `description`, `confirmThreshold`, and `filter` function.
2. That's it. The assignment algorithm, HUD, badge system, and post-game reveal all consume the
   registry dynamically — no other files need to change.

Priority guidelines for new tells:
- Hard constraints that should never be overridden: **1–15**
- Soft preservation constraints: **16–25**
- Conditional overrides: **26–40**
- Compulsion/aggression tells: **41–60**

---

## Strategic Implications

| Tell | How player exploits it |
|------|------------------------|
| `PRESERVE_PAIRS` | Lead singles the bot can't beat without breaking a pair — force it to waste a high card or pass. |
| `PRESERVE_TRIPLES` | Play singles or pairs in ranks where the bot's only beaters are locked in a triple — it will pass. |
| `PRESERVE_STRAIGHTS` | Deduce the probable straight range from what the bot refuses to play; lead singles inside it. |
| `HOARD_TWOS` | Play combos freely — bot's 2s are stranded as singles and can never be used as bombs. |
| `ALWAYS_BEAT_SINGLE` | Sacrifice a low single; bot must burn a card. Repeat to drain its hand and exhaust it early. |
| `HIGH_SINGLE_BREAKER` | Play singles just below 10 to bait it into conserving pairs; play 10+ to trigger pair breaks. |

---

## Tell Expansion Pool

Candidates for future addition. Each would be implemented as a new registry entry only:

| ID | Category | Description |
|----|----------|-------------|
| `NEVER_LEAD_TWOS` | aggression | Will not open a new round with a 2, even as a single |
| `ALWAYS_DUMP_LOWEST` | aggression | Always plays the absolute lowest valid card |
| `NEVER_PASS_PAIRS` | aggression | Never passes when it can beat a pair |
| `HOARDS_LAST_TWO_CARDS` | endgame | Will not reduce hand to 1 card; holds ≥ 2 until forced |
| `SCARED_OF_BOMBS` | preservation | Passes rather than play into a round where a bomb is likely |
| `NEVER_SPLIT_SEQUENCE_OF_PAIRS` | preservation | Will not break a sequence-of-pairs to play a regular pair |
| `GREEDY_LEAD` | aggression | Always leads the highest combo it can form when winning a round |
