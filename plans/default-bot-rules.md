# Default Bot Rules

Rules for how bots play before any tells are applied. Tells are layered on top of these as
move filters that remove or re-admit candidates — but the underlying candidate generation and
final selection live here.

---

## Overview

The bot decision loop has two stages:

1. **Candidate generation** — produce every legal move.
2. **Candidate selection** — pick the best move from the remaining candidates after tells filter.

The default rules govern how "best" is defined at both stages. Tells cannot affect candidate
generation (all legal moves are always considered); they can only shrink or expand the candidate
list before selection.

If all candidates are filtered out by tells, the bot falls back to **pass**.

---

## Cardinal Principles

1. **Shed cards as fast as possible.** Every turn the bot controls is an opportunity to reduce
   hand size. Passing is always a last resort, never a strategy.
2. **Play the lowest card that wins.** When beating a trick, use the minimum value necessary.
   Don't burn a 2 to beat a Jack if an Ace works.
3. **Prefer complete combinations over partial ones.** Playing a pair or sequence as a unit is
   almost always better than extracting a single card from it, because it sheds more cards per
   turn and preserves hand flexibility.
4. **Protect 2s.** 2s are the strongest singles. They should be spent on key blocks or endgame
   plays, not burned casually in the middle of a round.

---

## Leading a Round (No Current Trick)

When the bot wins a round and must open a new one:

### 1. Play combinations first, singles last
Prefer leading a complete natural combination over a singleton:

- If the hand contains a **sequence (straight)** of 3+ cards, prefer leading the lowest such
  sequence (sheds multiple cards, hard to beat with more common plays).
- If the hand contains a **triple**, prefer leading it over splitting it into singles.
- If the hand contains a **pair**, prefer leading the lowest pair over a singleton.
- Fall back to the lowest single only when no combination is available or all combinations are
  strategically held back.

**Priority order for leads (highest to lowest):**
1. Sequences of pairs (3+ consecutive pairs) — most efficient card shed
2. Sequences (straights) of 3+ cards
3. Triples
4. Pairs
5. Singles
6. Four-of-a-kind (bomb) — only lead as a last resort or forced endgame play; otherwise hoard

### 2. Lead the lowest within each category
Within whichever combination type is chosen, lead the **lowest-ranked** valid instance.
Example: holding [3♠, 3♥] and [9♣, 9♦], lead 3s pair, not 9s.

### 3. Never lead a 2 unless forced
2s are strong singles that beat everything and should be reserved for:
- Winning the final trick when one or two cards remain in hand
- Contesting another player's 2 in a critical moment
- Only lead a 2 when the hand contains nothing else to lead

### 4. Endgame adjustment (≤ 4 cards in hand)
When the bot holds 4 or fewer cards:
- Drop the preference hierarchy — play whatever sheds the most cards fastest.
- Leading a high single or breaking a pair to shed two singles is acceptable.
- Finishing is the only priority.

---

## Following a Trick (Beating the Current Play)

When another player has played and the bot must decide whether to beat it or pass:

### 1. Beat if the cost is low, pass if the cost is high

**Beat** when the bot can do so using a card or combination that:
- Is low or mid ranked (3 through Queen)
- Is not part of a more valuable natural combination in hand (pair, triple, straight)
- Does not require breaking a combo to produce a single

**Pass** when beating would require:
- Playing a 2 (unless endgame or the current trick is itself a 2)
- Breaking up a pair, triple, or straight to produce the required beater
- Playing the bot's only remaining high cards (K, A) when mid cards haven't been exhausted

### 2. Play the lowest valid beater
When choosing to beat, always use the lowest-ranked move that legally beats the trick.
Never over-invest. If 7♥ beats the current 6♠, don't play a Jack.

### 3. Matching combination type
Bots must always respond with the same combination type as the current trick (pairs beat pairs,
sequences beat sequences, same card count). Within that constraint, apply rule 2 above.

### 4. Bomb usage
Four-of-a-kind and sequence-of-pairs (3+ consecutive pairs) can beat a single 2.
Default: **never use a bomb unless the current trick is a single 2 or a multi-2 play.**
Bombs are too rare to spend on ordinary tricks.

### 5. Contesting 2s
When the current trick is a single 2:
- Beat it with a bomb (four-of-a-kind or 3+ consecutive pairs) if available.
- Otherwise, beat with a higher-suit 2 only in endgame (≤ 5 cards remaining). Otherwise pass.

---

## Card Value Tiers

Used to weight the "cost" of any card when deciding whether to beat or pass:

| Tier | Ranks | Default treatment |
|------|-------|-------------------|
| Cheap | 3 – 8 | Play freely; shedding these is the main goal |
| Mid | 9 – Q | Play to beat, but only if a cheaper beater is unavailable |
| Expensive | K, A | Reserve for key blocks; pass on low tricks if possible |
| Premium | 2 | Save for endgame or forcing a bomb response |

---

## Combination Integrity (Default — Overridden by Tells)

By default, bots prefer not to split combinations but *will* do so when there is no cheaper
alternative. This is a soft preference, not a hard rule.

- **Pairs:** Don't use one card from a pair as a single beater unless no other single of equal
  or lower tier is available.
- **Triples:** Don't extract singles or pairs from a triple unless no other beater of the
  required count exists.
- **Straights:** Don't pull an individual card out of a run as a single unless the hand has no
  standalone singles left.

*Tell versions (`PRESERVE_PAIRS`, `PRESERVE_TRIPLES`, `PRESERVE_STRAIGHTS`) turn these soft
preferences into hard bans, creating the observable behavioral leak the player can detect.*

---

## Pass Decision Summary

The bot passes when **all** of the following are true:
- Beating requires a card in the Expensive or Premium tier, AND
- The bot holds at least one cheaper combination it hasn't shed yet, AND
- The bot is not in endgame (hand size > 4)

Otherwise beat. When in doubt, beat — passing locks the bot out of the current round.

---

## Move Selection (Final Step)

After tells have filtered the candidate list, the bot picks the **lowest-value move** from what
remains. "Lowest" is determined by the highest card in the move:

```
sort candidates by: highest card in move (rank, then suit) ascending
pick candidates[0]
```

This ensures the bot always plays the minimum card necessary to win the trick. It is
intentionally simple and consistent — exploitable by a player who forces the bot into
increasingly expensive situations.

---

## Interaction with Tells

Tells layer on top of these rules as **candidate filters**:

- A **preservation tell** removes candidates that would split a valued combination, turning the
  soft default preference into a hard rule.
- An **aggression tell** re-admits candidates that default rules would have passed on, compelling
  the bot to play when it otherwise wouldn't.
- A **visual tell** (`REVEALED_CARDS`, `MARKED_CARDS`) has no behavioral effect — it doesn't
  alter the candidate list — but gives the player direct card knowledge from the start.

The default rules define what a "neutral" bot looks like. Tells warp that neutral profile into
a specific, identifiable pattern that an observant player can detect and exploit.
