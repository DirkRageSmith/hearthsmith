# CHARACTER-ANSWERS — Matt's answers, captured 2026-08-31

**Read this before [CHARACTER-BRIEF.md](CHARACTER-BRIEF.md).** Most of the twelve questions
are already answered here, in his own words. The interview that remains is much shorter than
the brief implies — do not re-ask what is settled below.

**Nothing here is code yet, and that is correct.** These are decisions to be frozen into
`ECONOMY.md` and an ADR, in the same order the event schema was: decide, freeze, then build.

> ### ✅ FROZEN 2026-09-01 — where each "still open" item below landed
>
> | Open item | Resolved as |
> |---|---|
> | The random point's mechanism | **Superseded — there is no random point.** 4 derived per level + a flat +1 to all six every fifth level. See ADR-024, "the floor" |
> | The actual curve formula | `300 × 1.01639^(n-1)`, flat at 1500 from L100 — ECONOMY §6 |
> | Which actions raise which stats | Draft table in ECONOMY §6; affinity stored on the event, so it stays tunable |
> | Where a character sheet lives | Local sheet + mirrored read-only summary of your partner's — **ADR-025** |
> | What crosses between two ledgers | A derived summary. Never earn events. — ADR-025 |
> | Are stats visible between partners | Yes, at summary granularity only — ADR-025 |
> | Skills ↔ stats (brief Q2) | Affinity in `grants` at log time, tallied at level-up — ADR-024 |
> | Bonded-party XP: shared or bonus | **Still open — parties deferred entirely, 2026-09-01** |
>
> The party section below is **captured intent, not frozen design.** Nothing in it is
> committed to. The one rule that *is* fixed: solo must always be possible (ADR-020).

---

## Settled

### Stat points — 4 per level, and none of them chosen

> *"stat points come from level ups you get 4 per level up based on what you did"* …
> *"3 points per level based on what we have done and 1 randomly distributed"*

**Three derived from what you actually did that level, one random.** No allocation screen,
ever. This is not option (b) from the brief and it is not quite (c) — it is **derived plus
chance**, which is a genuinely different answer from the four offered.

Two consequences worth stating now:

- **The player never chooses their build, and that is the point.** Your character is what
  your life made, not what you optimised. Divergence between two people at the same level
  comes from living differently, plus luck.
- **Randomness is safe here specifically because nothing can ever decrease.** A random point
  can only add. In a system with decay it would be cruel; in this one it is a small gift.

*Still open:* is the random point uniformly random, weighted, or seeded off the event ids so
it is reproducible from the ledger? **The last option matters more than it sounds** —
balances are computed and never stored, so if the roll is not derivable from the ledger it
cannot be recomputed on a second device and the two will silently disagree.

> **RESOLVED 2026-09-01 — and the answer was to remove the random point entirely.** It was
> first frozen as a ULID-seeded uniform roll, then replaced the same day by **4 derived
> points per level plus a flat +1 to all six every fifth level.** Running the worked example
> out to level 100 showed a rarely-fed stat gets rounded to ~2 points *for a century*, so the
> floor had to be a guarantee rather than a probability. Nothing is random now, which makes
> the reproducibility worry above moot rather than solved. **ADR-024, "the floor."**

### The curve — one day at level 1, one month at level 100, then flat forever

> *"i'd like level 1 to take about a busy healthy day, and by level 100 it take a slow or
> non focused month to level up one level and cap there. no level break infinite stats
> infinite levels"*

**The pacing caps; the levels do not.** Cost per level rises until roughly level 100, where
it settles at about a month of low activity, and stays there. Level 400 is reachable by
anyone who keeps going. Stats are likewise uncapped.

This answers the brief's Q3 the right way round — **wall-clock first, curve derived from
it** — and it answers Q4 almost for free: if a level costs a month forever, nobody
accidentally trivialises a game by grinding.

*Still open:* the actual formula, and what "a busy healthy day" is worth in XP given the
current catalogue.

### What stats DO — they gate and qualify. They do not multiply earnings.

> *"stats to determine the type and niceness of decoration or if you can open a lock or
> break it in an rpg"* … *"only be able to do or accomplish things with enough stat points"*

Matt landed on the safe side of the brief's Q6 unprompted. Stats **unlock** and **qualify**;
they do not inflate what actions are worth. Nothing here turns *ate a meal* into an
optimisation target.

**This should be frozen as a rule, not just a preference:** *no stat may ever multiply
`grants`.* It is the difference between a game about your life and a game that makes your
life a strategy.

> *"luck probably won't matter til we have items in a game to decorate or equip"*

Correct, and it means LUK can ship as an accruing number with no effect — exactly as Embers
did in Tier 0.

### Per-game interpretation

> *"each game will interpret stats slightly differently but aim to be similar as can be
> depending on app tool or game type"*

Brief Q7: **local interpretation, shared vocabulary.** Each game reads the same stats and
decides what they mean in its own context. The contract is the stat *ids and meanings*, not
the effects.

> *"if u use fit flexr ur str goes up"* … *"the fit flexr bridge to character sheet is last,
> after hearthsmith"*

FitFlexr feeds STR. **Sequencing is explicit: Hearthsmith first, FitFlexr's bridge last.**

### The town is your level

> *"i want it to be that your town isn't level 30 until u r level 30 in hearthsmith"*

No separate town progression. The town *is* the character sheet, rendered.

> *"i want to start with a bed and a tent each"* … *"you made it to level 2 place your
> house lvl3 -5 furnish it and build a well"*

A concrete opening: **bed + tent at level 1**, house at 2, furnishing and a well across 3–5.
Small enough to actually build, which is what slice 1.1 needs.

### What would make you delete this

> *"i hope as tech evolves i wouldn't delete the whole system ever until ive had whatever
> new crazy ai they make 10 years from now has a look at what we have done and takes another
> whack at it… so hope to never wipe this harddrive or git"*

Brief Q12 answered as *never* — which converts into a **design constraint, not a sentiment**:

- The ledger must stay readable by something that has never seen this code. Plain JSON,
  documented schema, export in the first release. All already true.
- **The `git` history is part of the artifact.** The reasoning in these commits is what a
  2036 model would read to understand *why*, not just *what*.
- Backups are load-bearing, not hygiene. Every repo is on GitHub as of today.

---

## The party — the real invention here, and the answer to "what's the bridge"

> *"he and I are always in a party together even when apart"* … *"eventually years from now
> when there are other users who are married they stay in party and get xp even when they
> are both at separate concurrent events. other people will only share party benefits when
> playing at same time in party"*

**Two classes of party, and the distinction is the mechanic:**

| | How it works |
|---|---|
| **Bonded party** (Matt + Smitherman; later, committed pairs) | Permanent. Shares XP and benefits **asynchronously** — you are in the party at 9am and he is in it at 11pm, and both count |
| **Session party** (everyone else) | Shares benefits **only while playing together at the same time** |

> *"a total party stat point or personal stat point are both acceptable, so if you wanna solo
> life and the last boss its gonna take a lot longer than if you did it in a party"*

Gates can check **either** a personal stat or a party total. Solo is possible and slower.
Never impossible — that would make the game require other people, which is its own harm.

**Why this is the bridge he was looking for.** He asked for *"the bridge that connects us and
keeps us separate enough"* and said he did not know what it was. It is **not a sync
protocol — it is the party.** Two ledgers stay wholly separate; the party is a relationship
between them, and it is the only thing that crosses. That is also why sharing `spend` and not
`earn` (already decided) works: the party shares *outcomes*, never the log.

*Still open — and this is the largest remaining question:*

- **Where does a character sheet live?** Device-bound, switchable on one device, or mirrored
  on both phones with one highlighted? He listed all three and picked none.
- **What actually crosses between two ledgers, and how does it travel?** Merging is a union
  by ULID and sorted — that part is free. The question is *what* is in the union.
- **Does bonded-party XP mean shared earning, or a bonus?** *"get xp even when they are both
  at separate concurrent events"* could mean either.

---

## Open, and deliberately so

> *"this is all a theoretical project so its all scrappable and all valid idk yet until I
> start getting shit to actually stick to a wall"*

Take that seriously. **The settled list above is enough to build slice 1.1 and the stat
accrual; everything below can wait for something real to react to.**

1. **Which actions raise which stats.** The mapping from the five skills and 33 verbs onto
   STR/VIT/SPD/AGI/DEF/LUK. Nothing is decided.
2. ~~**The random point's mechanism.**~~ **Closed 2026-09-01 — no random point exists.**
   Replaced by a flat +1 to all six every fifth level. See the banner at the top.
3. **The two-character bridge.** The largest open question, and the one blocking anything
   multiplayer.
4. **Are stats visible between partners?** Brief Q8, unanswered.
5. **Exact XP numbers.**

---

## The farm animals — KEEP THIS, and here is the version that is safe

> *"my fave part of zelda was chickens as a kid so i really like the ur diet decides ur farm
> animal thing i think its adorable and hilarious"* — 2026-08-31

**The reference is the design spec.** Zelda's cuccos are never a punishment. They accumulate,
they get absurd, and if you swing at one the sky comes for you — but nothing about them ever
implies you are living wrong. They are a *presence*, not a verdict.

**A cumulative farm was proposed and Matt rejected it**, correctly:

> *"i would like the 200 cows to be replaced with other animals and vegetables as you log, i
> don't want 1000 cows in 10 years, but if all you eat is animals and not enough veggies i
> would like the cows chickens and pigs to get a little annoying just visually and maybe
> sound eventually"*

A farm that only ever grows stops being a picture of who you are now. So:

**Ratio over a recent window, with a fixed farm size.** The farm reads roughly the last 30
days, not the whole ledger. **Composition changes; population does not grow.** Eat mostly
meat and a same-sized farm fills with cows, pigs and chickens; log vegetables and they are
displaced by crops, beehives, an orchard. No thousand cows in ten years, by construction.

**This is not confiscation and does not touch ADR-006's no-taking rule.** Nothing the player
*bought* is removed. The farm is generated scenery, a read on what was logged — the same way
a balance is a read on `grants`. Purchased buildings and furnishings are permanent as ever.

**Three guarantees that keep the annoyance safe:**

1. **One action always visibly helps.** `ate_a_vegetable` ("Ate something green") is an
   **upkeep-tier** verb — reachable from bed on the worst day of your life. The crowding must
   never require a week of good eating to ease; that is the shape of a streak, and streaks
   are forbidden.
2. **A low ceiling, and it is comedic.** Crowded, clucking, a cow in the doorway. Never "your
   town looks bad." The foreseeable harm is a depressed player eating what they can manage
   and finding the game has become unpleasant *precisely when they are struggling* — so the
   ceiling exists to make that impossible rather than unlikely.
3. **Cosmetic only. It may never gate, gate-keep, or cost.** No blocked purchase, no reduced
   Embers, no locked item. If the farm ever affects progression, it has become a penalty.

**Sound is the risky half and should ship last.** Visual crowding is glanceable and easy to
ignore; audio follows you. The test: *if a player would want to mute it, it has crossed from
comedy into nagging.* Prefer sound while actively viewing the farm over ambient-on-open.

Design notes that follow:

- **Variety produces a menagerie; repetition produces a crowd.** Neither is a failure state.
  One is just funnier, and the player works that out themselves.
- **Never rank the farms.** No "balanced diet" achievement, no comparing towns — that is the
  self-care-leaderboard rule (ADR-006) arriving through a side door.
- The animals are a **read** on the Kitchen verbs, not a new event type or currency. Ordinary
  events you already log, rendered as livestock. **It costs nothing schema-wise** — every meal
  already in the ledger is a cow that has not been drawn yet.

## One tension already resolved, kept for the reasoning

> *"maybe you eat a lot of beef so your town gets overpopulated with cows until you eat a
> more varied diet idk"*

This is a good idea and it sits **directly on the line the harm rules draw.** ECONOMY.md §4
forbids guilt, penalty and anything that makes a bad week feel worse — and a town that visibly
degrades because of what you ate is a game commenting on your diet.

The distinction worth holding: **consequence is fine, judgment is not.** A town full of cows
because you logged a lot of beef is funny, legible, and *reflective* — it shows you yourself.
A town that becomes uglier, or that withholds something until you eat differently, is a
penalty wearing a joke.

Test to apply: **would this feel bad on the worst week of your life?** If the cows are just
cows, it passes. If the cows are a scold, it does not. Worth an explicit line in the ADR,
because the difference is one design meeting away from being lost.
