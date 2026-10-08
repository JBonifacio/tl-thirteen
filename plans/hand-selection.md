# Hand Selection — easier card taps on phones

**Status:** Done. Phase 1 shipped; the planned Phase 2 (selection feedback) was dropped on 2026-10-08.
**Design:** [Two-Row Hand Mockup](https://claude.ai/artifact/WxpkDMMzgVHWiKZDducbui). It shows the current single fan next to the proposed two-row hand at 390px. The proposed board is interactive and has a dark-mode tweak.
**Goal:** Stop misclicks in the player's hand on phones. Today 13 cards share about 358px, so each card shows a strip of roughly 26px (as low as 16px) and every tap lands close to two cards. Give each card a tap target of at least 44px and make the selected state clearer.

Presentation only. No change to game rules, bots, scoring, leaderboard, replay data or the store.

---

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Phone layout | Two overlapping rows instead of one fan. Row 1 holds `ceil(n / 2)` cards, row 2 the rest (13 cards: 7 + 6) | Every card is shown in full width (48px) with about 4px between neighbours. The whole hand stays visible, with no horizontal scroll |
| Reading order | Sorted order runs left to right along row 1, then left to right along row 2 | Keeps the hand sorted the way players expect, so pairs and runs stay adjacent (apart from the break between the rows) |
| Row overlap | Row 2 overlaps the bottom 20px of row 1. Row 1 cards keep 48×52px visible, and their rank and suit stay in the top-left corner | Costs about 52px of height instead of 72px, and the corner index is never covered |
| When it applies | Below 1024px, and only when the hand has more than 7 cards. A hand of 7 or fewer stays in one row, where the step is already 44px or more | Small late-game hands should not jump to two rows |
| Desktop | No change. The single fan from 1024px up already has room | Cards are 64px there with a 36px preferred step |
| Selection lift | Unchanged: selected cards lift 14px. A lifted row 2 card paints over row 1 because row 2 comes later in the DOM | No `z-index` needed |
| Stacking | The two rows must not create their own stacking context (no `transform`, `opacity` or `isolation` on the row wrappers) | Otherwise a lifted card could not paint above the other row |

---

## Phase 1 — Two-row hand on phones ✅

Changes `Hand.tsx` and the layout helper. No change to `PlayingCard` sizes.

- [x] In `Hand.tsx`, split `sorted` into `rows: Card[][]` when `!isDesktop && sorted.length > 7`, with row 1 = `ceil(n / 2)` cards. Otherwise keep one row.
- [x] Render each row as a flex container. Use `justify-between` for a full row 1 and `justify-center` with the same gap for a shorter row 2, so the columns line up. Row 2 gets a negative top margin of 20px.
- [x] Keep the single-fan path (`fitStep` and the negative `marginLeft`) for desktop and for hands of 7 or fewer.
- [x] Reserve vertical space for the extra row and for the 14px lift on row 1 (top padding), so the invalid-play message and the buttons do not jump when cards are selected.
- [x] Check `GameScreen.tsx`: with the extra ~52px, the play area and opponents must still fit at 390×844 without page scroll. If they do not, list what gives (for example, tighter spacing in `PlayArea`) in the change list before editing.
- [x] Keep the existing `aria-label` and `aria-pressed` on each card button, and keep DOM order equal to sorted order so Tab and screen readers follow the hand in order.

**Done when:**
- `npm run build` passes.
- At 390px with a 13-card hand, each card button measures at least 44px wide and 44px tall (check in dev tools), with no overlap in row 1.
- A pair that spans the row break (such as 9♣ in row 1 and 9♥ in row 2) can be selected, and the lifted row 2 card paints above row 1.
- A hand of 7 or fewer cards renders in one row, and a hand shrinking from 13 to 7 or fewer goes back to one row without layout jumps in the message and button area.
- Desktop (1280px) looks unchanged.
- Light and dark mode both checked at 390px and desktop width.

---

## Later

- Press-to-peek: pressing a card raises it above its neighbours before you release (helps desktop and fat-finger cases).
- Drag across cards to select several at once, useful for pairs and runs.
- Dropped Phase 2 (selection feedback): `touch-action: manipulation` on cards, a short press state, an explicit `z-10` on selected cards, and re-checking the lift and warn outline. Revisit if taps still misfire on real devices.
