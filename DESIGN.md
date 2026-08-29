# Hearthsmith — design

*Created 2026-08-25. **Revised the same day (second pass)** after the first draft came back
wrong: it described a room that improves passively, when the thing being built is a **city
builder with a spendable economy and residents.** Covers Tiers 0–3. Tier 4+ lives in
[../VISION.md](../VISION.md).*

---

## The pitch

You take care of yourself, and you spend what you earn building a town for the people you
love. Some of them are made up. Some of them are real. If the real ones play, the house
you built for them becomes theirs.

## The core loop, stated once

**Do a real thing → log it → earn Embers → spend them on the town.**

That is the whole game. Every tier is that loop with a bigger radius. Any feature that does
not sit inside that sentence is a different game and belongs in FORGE's idea box.

**The verb is *spend*, not *receive*.** This is the correction that reshaped the design: a
home that improves on its own is a progress bar with furniture. A home you *bought, piece
by piece, choosing what mattered to you* is a place you made. Everything below follows from
that.

---

## Why "cozy" is a mechanical choice, not an aesthetic one

Animal Crossing works because **nothing is ever urgent and nothing is ever lost.** You can
leave for six months and your town is still there. That is not decoration; it is the exact
property that makes a game safe to build around self-care for people whose lives are
irregular by default.

The genre choice and the harm-prevention rules in [../ECONOMY.md](../ECONOMY.md) §4 are the
same decision. A cozy builder *cannot* have decay mechanics without stopping being cozy, so
the aesthetic enforces the ethics.

**The comparison to avoid:** habit apps that use streaks, red badges, and "you're falling
behind." They convert a bad week into evidence against yourself. Hearthsmith's whole
differentiation is that it is structurally incapable of that.

**And the one this shares DNA with:** the good city builders are about *stewardship* —
you're never finished, you're just making it a bit better. That is the correct emotional
register for a self-care game, far more than "complete your goals."

---

## The economy in one screen

Four currencies, full detail in [../ECONOMY.md](../ECONOMY.md) §1:

- **XP** — permanent record. Never spent, never goes down. Proof time passed and you were there.
- **Embers** — **the spending currency.** Earned from every action, spent on everything you build.
- **Skill points** — permission, not payment. They unlock *what appears in the shop*; Embers pay for it.
- **Favor** — community standing, minted only by Tier 4 witnessed favours. The only currency that could ever touch real money.

**Spending is not losing.** The rule against decay forbids numbers being *taken*; a balance
dropping because you bought a kitchen is a reward being *collected*. The test: *did the
player choose it?*

**Nothing built is ever taken back.** No repossession, no upkeep costs, no taxes, no
buildings falling into disrepair. Ever. This is a city builder with the punishing half of
the genre deliberately amputated.

---

## The hearth — the one central metaphor

There is a fire at the centre of your first home. Its **warmth** reflects recent activity
across all five skills.

- Warmth **rises** with any logged action, from any skill, at any effort level
- Warmth **settles** toward a floor when nothing is logged — it **never goes out**
- The floor **rises permanently** with total XP

**The worst your town can look after six months is better than the best it looked in week
one.** A bad month costs brightness, never progress. Coming back after a hard stretch shows
you a place that is still warmer than you left it the first time — not a punishment screen.

This is the mechanical implementation of "no decay to punish": the *visual* feedback of
neglect without the *moral* judgment of it. And critically, warmth is **not a currency** —
it buys nothing, gates nothing. It is only ever a mirror.

---

## Residents — the heart of the thing

**You build homes for the people in your life.** Some residents are invented NPCs who move
in on their own as the town grows. Some are modelled on people you actually know: you name
the house, you choose where it sits, you decide who lives next door to whom.

This is what makes it a town rather than a dollhouse. It is also, structurally, the
**social graph** — which means the multiplayer layer at Tier 3 is not a new system bolted
on, it is the existing one turning out to be real.

### The invitation

*"I built you a house. Come live in it."*

That is the growth mechanic, and it costs nothing to build because the house already
exists. When a real person installs the game, the home you made **becomes theirs** — they
keep it, upgrade it, and their town and yours become adjacent neighbourhoods.

No marketing message ever written performs like a friend saying they built you something.

### The rules that make this safe — not optional

Building a game around real relationships is emotionally loaded, and the foreseeable
failure modes are specific. Each rule below exists because of one:

1. **Residents are private by default.** Nobody learns you built them a house unless you
   deliberately choose to tell them. Some of these will be people you've lost, people you're
   not in contact with, people who don't know how you feel. That has to be safe.
2. **A resident can be renamed or retired at any time, and the building stays.** People fall
   out. People die. Hours of spent Embers must never be hostage to a relationship ending —
   and a game that makes you bulldoze someone's house to stop being reminded of them is
   cruel. Retiring is reversible.
3. **The game never contacts a real person.** No "Matt built you a house!" notifications, no
   address-book scraping, no contact import. Invitations are a link the player sends
   themselves, deliberately, once.
4. **No resident ever expresses disappointment in you.** They can be glad to see you. They
   are never sad you were gone, never waiting, never "wondering where you've been." An NPC
   modelled on your real sister guilting you for a bad week is the single worst thing this
   game could do to someone, and it is exactly what the genre's conventions would suggest.
5. **Residents have no needs you must service.** No hunger bars, no friendship decay, no
   maintenance. They are people you made a place for, not tamagotchis.

### What residents actually do

Small, warm, low-stakes: they comment on what you've built, they have preferences that
gently hint at what they'd like nearby, they show up in the town square, they react to the
neighbourhood being lit. **All flavour, no obligation.** A resident's opinion may never gate
progression.

---

## Skills, the shop, and progression

Five trees — **Home, Body, Kitchen, Craft, Community** — chosen so every one is reachable
on a bad day (rationale in [../ECONOMY.md](../ECONOMY.md) §1).

**Skill points unlock the catalogue; Embers pay for it.** Body 5 makes the good bed
purchasable; Embers buy it. This split matters: a neglected tree limits your *options*
without ever blocking your *progress*. You can always spend, you just may not have unlocked
the fanciest thing yet — so the game never nags you toward a specific real-world behaviour.

**Pricing:** the first upgrade in any room costs about **one good week**, not one good day.
And prices are set so **the floor actions alone can eventually buy anything** — someone who
only ever manages teeth and medication builds a town more slowly. They never build a
smaller one.

**No level caps, no prestige, no resets.** Levels get further apart, and that is all.

### Tier 1 — the first home

One plot, one small home, a shop of ~20 items, skill gates, placement, the hearth. That is
the whole tier. It is a complete tiny city builder.

### Tier 2 — the town

More plots and buildings. Rooms unlock as trees level: bathroom (Body 5), kitchen
(Kitchen 5), workshop (Craft 10), garden (Home 10). Then **residents** — the section above.
This is Hearthsmith proper.

### Tier 3 — neighbourhoods

Friends who took the invitation have their own towns. Yours sit adjacent as
**neighbourhoods**.

**The topology is a graph, not a world.** Your town is yours; adjacency is by mutual
consent; you can belong to several neighbourhoods at once — your family's, your friends'.
**Deliberately not an MMO.** One shared persistent world means moderation, griefing, server
cost, and a permanent operations job, none of which survives the funding model in the
README.

**Shared projects, never competition.** A park, a bridge, a lit street on the boundary
between two towns, that everyone contributes Embers toward. **Nobody ever sees what anyone
logged** — they see what got built. That is how community shows up without violating the
"no comparing self-care" rule.

---

## Art direction

**Decision deferred to the start of Tier 1.** Recorded so it is not re-argued:

1. **Bought tileset** — LimeZu / Smith_Tile / BlacksmithDemo packs are already on this
   machine from the FORGE pixel-skin work. Fastest and cohesive; **commercial licence must
   be verified before a single asset ships.**
2. **CSS/SVG only** — a warm abstract space made of shapes and light. Cheapest, zero licence
   risk, most distinctive, hardest to get right.
3. **Commission** — real quality, real money, real delay. Not before Tier 2.

**The builder changes the maths here.** A shop needs *many* distinct objects, and a town
needs many more. Option 2 was viable for one passive room; it is much harder for a
catalogue. Option 1 gets more attractive the moment a shop exists — which is why the
licence check is worth doing now, cheaply, rather than discovering a problem at Tier 2.

The one firm constraint: **it must read at a glance on a phone, at night, at low
brightness.** That is when this app will actually be opened.

---

## What the player never sees

- A number going down that they didn't choose to spend
- Anything they built being taken away, damaged, or requiring upkeep
- Another player's self-care
- A resident who is disappointed in them
- A notification they did not ask for
- A locked door with "come back tomorrow"
- Any request for real money at Tiers 0–3

---

## Resolved questions

*Decided 2026-08-25. Recorded so they are not reopened.*

**Can you log yesterday? — YES.** Backfill is allowed, capped at ~7 days. The event carries
both `ts` (when it actually happened) and `logged_at` (when it was recorded), rather than a
single flag. Two fields because trust tier T1 depends on *real* timing to mean anything:
`ts` says when you brushed your teeth, `logged_at` says how honest the record-keeping is,
and conflating them destroys both signals. Forgetting to open an app is not a moral
failure, and a self-care game that punishes it has failed at its only job. (ADR-011)

**Who defines the verbs? — MATT DOES.** The catalogue is **curated**, authored like a game's
item list, and it grows deliberately over time. Users pick from it; they do not invent
verbs, because a free-text verb field breaks the shared schema that the entire ten-year plan
depends on. **What a verb grants is expected to be retuned as the catalogue grows; the verb
itself is never renamed** — which is exactly why `xp` and `embers` are stored on each event,
so a rebalance in 2031 cannot silently rewrite what someone earned in 2026. (ADR-012)

**What stops someone tapping every action every day forever? — nothing, and that's
correct.** Embers buy only things inside your own town. Cheating them is as consequential as
cheating at solitaire. Favor — the currency where cheating would take something from someone
else — requires another human to confirm before a single unit exists.

---

## Still open

*Not blockers. Answer them when the tier that needs them arrives.*

- **Free placement or slots?** Free placement is the genre standard and far more expressive;
  slots are dramatically cheaper to build and much easier to make look good without an
  artist. Tier 1 probably ships slots and earns its way to free placement.
- **Does the hearth need sound?** Probably eventually. Not in Tier 0 or 1.
- **What happens to a resident's house when its real person joins?** Leaning: it transfers
  intact, with everything you bought for it, and they can change anything. Open question is
  whether you keep a copy in your own town.
- **Do neighbourhoods need a shared clock?** Real-time day/night across a graph of towns in
  different timezones is a genuine design problem. Deferred to Tier 3.
