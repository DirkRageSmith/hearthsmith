# CHARACTER-BRIEF — the interview that must happen before stats are written

> ### ✅ RESOLVED 2026-09-01 — this interview has been run. Do not run it again.
>
> The answers are frozen in **`ECONOMY.md` §6** and recorded as **ADR-024** (the stat
> layer, with every rejected alternative and the mandatory worked example) and **ADR-025**
> (where a character sheet lives across two phones).
>
> **Q9 — parties and bonded pairs — was deliberately left open.** Matt's call:
> *"maybe we don't need to make parties yet."* That is the only question still available
> to ask, and `CHARACTER-ANSWERS.md` holds the captured intent for whenever it is.
>
> This file is kept for its reasoning and its constraint list, not as a task.

**How to use this file.** Open a session in `C:\Projects\ragesmith` and say:

> `read hearthsmith/CHARACTER-BRIEF.md and interview me`

The session's job is to **ask, not to design.** One question at a time, multiple-choice
where possible, and it stops when the twelve decisions below are answered — then writes
them into `ECONOMY.md` and a new ADR. **It must not write stat code during the interview.**

---

## Why this is an interview and not a spec

`character.js` already computes levels, standings and a crest from the ledger. What does
not exist is the **stat layer** — STR / VIT / SPD / AGI / DEF / LUK — and Matt wants it to
matter: *"high luck increases points earned or item drop rates or random encounters
eventually,"* and *"my husband and I could be level 30 already with vastly different stats
by the time any game is created."*

That second sentence is the whole design problem in one line. **Two people, the same
number of levels, different characters** — which means stats cannot be a function of level
alone, and the difference has to come from somewhere. Where it comes from is question 1,
and everything else follows from it.

**This is a freeze, like the event schema was.** `CLAUDE.md`'s rule is *only ever add,
never redefine*: a stat's meaning, once players hold points in it, cannot change without
retroactively rewriting who they are. Getting it wrong is not a bug, it is a migration
nobody can honestly perform. The event schema got three amendments before a line of code
and that is exactly what made it survivable — do the same here.

---

## Hard constraints the answers must respect

The interviewer must **refuse** any answer that breaks these, explain why, and re-ask.

1. **No decay, no penalty, no confiscation.** ECONOMY.md §4 and ADR-006. A stat may never
   fall. Not from inactivity, not from a bad month, not ever. This kills the most common
   RPG idea in the genre — "use it or lose it" — and it is not negotiable, because the
   stated audience includes people with ADHD, autism and depression.
2. **No comparing self-care between players.** So a shared world may show *what someone
   built*, never *what they logged*. If stats are visible to others, they must not be
   legible as "he showered more than me."
3. **Nothing may ever require a self-care action to progress**, and **every award must be
   reachable from bed.** A stat system that rewards leaving the house more than resting
   fails this on a bad week.
4. **Never redefine a shipped ID.** Stat ids join verbs, currencies and skills on that
   list. `str` means what it meant on day one, forever.
5. **Balances are computed, never stored.** Stats must derive from the ledger like
   everything else, or two devices will disagree and there is no server to arbitrate.
6. **Self-care may never mint Favor**, and Embers and Favor never exchange. If a stat
   affects earnings, check it cannot become a laundering path between the two.

---

## The twelve questions

Ask them **in this order**. Later ones depend on earlier answers.

### 1. Where do stat points come from?

The load-bearing question. Options, with what each implies:

- **(a) Derived from what you actually did.** Body actions raise STR/VIT, Craft raises
  something else, and so on. Two people diverge because they *live* differently. Most
  honest to the premise; no allocation screen; but the player never *chooses* their build,
  and a cozy-game player who hates the gym is capped on STR forever.
- **(b) Allocated by the player.** Each level grants N points, spend them as you like.
  Classic, satisfying, gives real agency — but then stats say nothing about the person,
  and level 30 is level 30.
- **(c) Hybrid: derived floor, allocated bonus.** Actions set a baseline; each level also
  grants a few free points. Both signals present. More to explain, more to balance.
- **(d) Derived, but you choose the mapping.** You did the action; you decide whether
  *cooked a meal* feeds VIT or a Craft-side stat. Novel, and it makes the same life
  produce different characters.

**Follow-up whatever the answer:** if points are ever spendable, **can they be moved
later?** Rule 1 says nothing is taken — does a respec count as taking, or as choosing?

### 2. What is the relationship between the five skills and the six stats?

`ECONOMY.md` already ships five skills — Body, Home, Kitchen, Craft, Community — as
`skill:*` currencies. Six stats is a different shape. Is a stat:

- a **view** over skills (STR is a formula on Body + Home), or
- an **independent axis** with its own grants in the event, or
- **both** — skills are the game-facing progression, stats the cross-game one?

*A view costs no schema change. An independent axis needs `grants` keys, which is additive
and legal, but permanent.*

### 3. Infinite levels — what is the curve, and what does a level mean?

Matt wants **no cap**. So:

- What XP does level *n* need? (Linear, so level 300 is reachable? Exponential, so it
  asymptotes? A soft wall that slows but never stops?)
- **Real-life pacing:** XP comes from actual actions, so there is a hard ceiling on daily
  earning. How long should level 30 take — a month, a year, five years? *Answer this in
  wall-clock time, then derive the curve from it, never the other way round.*
- Does a level grant anything by itself, or is it just a number that goes up?

### 4. What breaks when someone is level 400 and the game is not?

Infinite levels meet finite content. Does a very high stat trivialise a game built for
level 20? Options: diminishing returns, per-game soft caps, or stats that change *what*
happens rather than *how much* (see Q6).

### 5. What does each stat actually mean, in one sentence, forever?

Six sentences. They are the permanent part. Push for **specific and game-agnostic** —
"STR is how much you can carry and how hard you hit" is fine for an RPG and meaningless in
a cozy builder. What is STR in a town-building game?

### 6. What does a stat DO — modify a number, or unlock a behaviour?

Matt's own example is *"high luck increases points earned or item drop rates or random
encounters."* Note the three are different in kind:

- **Multiply earnings** — dangerous. It makes self-care actions worth *more* to a
  min-maxer, which turns "ate a meal" into an optimisation target. Consider it carefully
  against constraint 3.
- **Drop rates / random encounters** — safer. Changes *what you find*, not what you owe.
- **Unlocks** — safest. A threshold reveals an item, a room, a path. No inflation.

Ask which of the three LUK is allowed to be, then generalise to the other five.

### 7. Is a stat's effect global, or per-game?

Each future game has its own skills. Do stats mean the same thing everywhere (one contract,
every game obeys it), or does each game read the stats and interpret them locally? *The
first is a promise you must keep in 2031. The second is freedom that risks incoherence.*

### 8. Are stats visible to other players?

Constraint 2 permits showing what was built and forbids showing what was logged. A stat
block sits awkwardly between. Is it private, opt-in, or public-but-unattributed?

### 9. Two players, one world — do stats interact?

Matt and his husband, different builds. Does high LUK help the *neighbourhood*? Can one
person's DEF protect a shared project? Co-op only — ECONOMY.md forbids competition on
self-care, and a stat race is competition wearing a number.

### 10. What is the first stat effect you would actually feel?

Ground it. In slice 1.1 — a shop and one room — what would a high-STR character notice
*this month*? If the honest answer is "nothing until the RPG exists," say so plainly and
mark stats as **accrued now, spent later**, exactly as Embers were in Tier 0.

### 11. What is tunable and what is frozen?

`ADR-012` set the precedent: *what a verb grants is expected to be retuned; the verb itself
is not.* Apply it here. Frozen: stat ids, stat meanings. Tunable: the numbers, the curve,
the per-game effects. **Say so explicitly**, or someone will rebalance meaning by accident.

### 12. What would make you delete this whole system in a year?

The pre-mortem. If the honest answer is "if it made me feel bad about a bad week," that
belongs in the ADR as a stop condition with a name.

---

## What the interview produces

When the twelve are answered, and not before:

1. **`ECONOMY.md` §6 — the stat layer.** Ids, one-sentence meanings, where points come
   from, the curve, and what is frozen versus tunable. Written in the same voice as §2.
2. **An ADR** in `DECISIONS.md` recording the choice at Q1 and Q6 *with the alternatives
   that were rejected and why* — those two are where a future session will want to argue.
3. **A worked example, mandatory.** Two characters at level 30 with genuinely different
   stat blocks, showing the actual events that produced each. If that example cannot be
   written, the design is not finished.
4. **Tests that mechanise the constraints**, in the style already used for the harm rules:
   a stat can never decrease; a purchase never touches `core:xp`; no stat path mints Favor.
   Write them **before** the implementation — that is what caught two real bugs in slice
   0.2.

## What the interview must NOT do

- Write `stats.js`. Design first, freeze, then build — the schema freeze is the precedent.
- Touch `NEXT.md`. **Slice 1.1 is the shop**, and this brief does not preempt it. Stats
  land in a later slice with its own line.
- Invent stats beyond the six. STR/VIT/SPD/AGI/DEF/LUK is Matt's list.
- Accept "we'll decide later" on Q1, Q5 or Q11. Those three are the freeze.
