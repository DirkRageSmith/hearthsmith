# Hearthsmith

**A cozy city builder where taking care of yourself is how you earn.**

You log real self-care, you earn **Embers**, and you spend them building a town for the
people in your life — invented neighbours and real ones alike. If the real ones play, the
house you built for them becomes theirs.

The first Ragesmith product, and the seed of everything in
[../VISION.md](../VISION.md). One name, six tiers, no rewrites: the thing that ships in
a few weeks is the same thing that — if it keeps going — becomes the world.

---

## Status

**Tier 0 — The Ledger. BUILT AND GREEN as of 2026-08-25. Next: slice 0.6, ship it.**

Slices 0.1–0.5 and 0.7 are done. The app runs, the doctor is HEALTHY, and 22 tests pass.

**The only thing left in Tier 0 is handing it to a human**, which is precisely the step this
machine has never completed on any project: FitFlexr sat finished and deployed for eleven
days without a tester, and lesson-looper's Pages has 404'd since 2026-08-10. The brief is in
[../NEXT.md](../NEXT.md).

---

## What Tier 0 actually is

A single-page PWA. You open it, you tap the things you did today, you watch five skill
bars fill and an **Ember balance** grow. That is the entire product.

- No world, no graphics beyond good type and colour
- **No shop yet — Embers accrue with nothing to spend them on, deliberately**
- No accounts, no server, no network
- No verification — pure honour system (trust tier T0)
- No real money, no Favor, none of it

It is deliberately close to a nice habit tracker. **Tier 1 is where it becomes a builder**
— a shop, a home, and a month of saved Embers already waiting to be spent on it. Opening
the builder at zero would throw away the only asset Tier 0 produces.

The ambition is entirely in the data model underneath, which everything for the next
decade reads from.

## Stack

**Copy FitFlexr exactly.** Vanilla HTML/CSS/JS, `localStorage`, no build step, deployed
to GitHub Pages.

This is not a place to learn a framework. That stack has already shipped from this
machine, its one real interaction bug is documented and fixed (the `.card-body
overflow-y:auto` touch-scroll trap — see `fitflexr-project.md`), and re-using it means
zero unknowns between here and a live URL.

**Test on a phone before believing anything works.** FitFlexr's touch swiping was
completely broken on phones for two weeks while working perfectly with a mouse. A desktop
browser is not a test.

## Slices

| # | Slice | Done means | ✓ |
|---|---|---|---|
| 0.1 | Event schema | `../ECONOMY.md` §0/§2/§2.5/§2.6 final + `currencies.json` | ✅ **2026-08-25** |
| 0.2 | Log an action | `ledger.js` — append-only, preserve-unknown, ULIDs, offset-aware timestamps | ✅ **2026-08-25** |
| 0.3 | Action catalogue | `catalog.json` — 33 actions across 5 skills, 4 effort tiers | ✅ **2026-08-25** |
| 0.4 | Balances + levels | Every total computed from the ledger (`sum(grants) − sum(cost)`), never stored | ✅ **2026-08-25** |
| 0.5 | Day view | The app — hearth, Embers, XP, five skill bars, today's log, backfill toggle | ✅ **2026-08-25** |
| 0.6 | **Ship it** | Live on Pages, HTTP 200 verified, on Matt's phone home screen | ☐ **← next — see [../NEXT.md](../NEXT.md)** |
| 0.7 | Export | One button dumps the whole ledger as JSON (ADR-005, non-negotiable) | ✅ **2026-08-25** |

**Health:** run `node tools/doctor.mjs` from the studio root — 22 ledger tests, an
end-to-end storage simulation, the harm-prevention rules mechanised, and doc-vs-code drift
detection. Currently **HEALTHY**.

## What exists

| File | What it is |
|---|---|
| `ledger.js` | The append-only event store. No DOM — runs identically in a browser and in node, which is how one test suite covers both. |
| `catalog.json` | The curated action list. Authored, never generated (ADR-012). |
| `currencies.json` | The currency registry. An ID not in here is a hard validation error. |
| `index.html` | The app. Dark-first, thumb-sized targets, no build step. |
| `tests.js` / `tests.html` | 22 tests. `node tests.js`, or open `tests.html` in a browser. |
| `sw.js` · `manifest.json` · `icon.svg` | Installable and offline-first — a bad day with no signal is still a day you can log. |

**Running it locally:** serve the folder, don't open the file directly —
`python -m http.server 8080` then `http://localhost:8080`. Opening `index.html` off the
disk blocks the `catalog.json` fetch; the app says so rather than showing a blank page.

## Deliberately not in Tier 0

Streaks · notifications · avatars · a map · other people · any graphic needing an artist ·
any backend · settings · themes · onboarding.

Every one of these is a good idea for a later tier. Building one now is how Tier 0 becomes
a weekend project, and weekend-sized is the only band where things here die (ADR-004).

---

## The rules this game does not break

Full list and reasoning in [../ECONOMY.md](../ECONOMY.md) §4. In short:

1. No streak that can break
2. No decay, no penalty, no confiscation — **spending is fine, taking is not.** The test is
   *did the player choose it?* And **nothing built is ever taken back**: no upkeep, no
   repossession, no disrepair
3. No comparing self-care between players
4. No guilt notifications
5. Nothing may ever *require* a self-care action to progress
6. Every award reachable from bed

Plus five more for residents once Tier 2 arrives (ADR-010) — the sharpest one being that
**no resident is ever disappointed in you.** Never sad you were gone, never waiting, never
"wondering where you've been." That is exactly what genre convention would suggest, and an
NPC modelled on someone real guilting you for a bad week is the worst thing this game
could do to a person.

These are product requirements. A feature that violates one does not ship, whatever it
does to engagement.

---

## Where I stopped

*Update this section at the end of every session. It is the first thing a cold session
reads, and an undocumented park becomes an abandonment.*

> **2026-08-25** — Project created. Studio and game named, vision/roadmap/economy/ADR docs
> written, Mission Control and SYSTEM-OVERVIEW updated. No code written.
>
> **2026-08-25 (second pass)** — Matt corrected the design: this is a **city builder**, not
> a room that reacts. Reworked accordingly. **Embers** added as a spendable currency (the
> first draft had none, which made it a habit tracker with a picture attached); the "no
> loss" rule split into *spending is fine, taking is not*. **Residents** added — you build
> homes for real people in your life, and if they play, the house becomes theirs, which is
> also the growth mechanic. Tiers re-cut: 1 = First Home (the shop), 2 = The Town
> (residents), 3 = Neighbourhoods (a graph, not an MMO), 4 = The Guild, 5 = Money.
> Two open questions closed: **backfill yes** (ADR-011, two timestamps), **verbs curated**
> (ADR-012, grants retunable, verbs never renamed). Still no code.
>
> **2026-08-25 (slice 0.1 — DONE)** — Matt asked for more kinds of XP, skill points and
> currency across different minigames, which changed the schema before it was frozen rather
> than after. Fixed `xp`/`embers` fields became a **`grants` map of currency ID → amount**,
> backed by `currencies.json` — three classes (`core:*` closed at exactly three forever,
> `skill:*` extensible by dot notation, `<tool>:*` local), a **one-way valve** so local
> currency can never convert to core, and a **discipline rule** (`only_buys` may not be
> empty) so variety never becomes currency soup. ADR-014.
>
> Then a second amendment the same day, after Matt named the real requirement — *room to
> grow in any direction, nothing coming crashing down halfway.* Added **`v`** (schema
> version — migration insurance that cannot be added retroactively with confidence),
> **`subject`** (an optional ID for a **shared thing many people's events point at**), and
> a **preserve-unknown-fields** rule. `subject` closed a genuine structural gap: the schema
> handled *one person did one thing* but had no way to express *many people converging on
> one thing* — a beach cleanup, a shared bridge, a guild task. Now ten attendees write ten
> ordinary events sharing one `subject` and the cleanup **is** the set of events pointing at
> it: no new table, no new event type. ADR-015 + `ECONOMY.md` §2.6. Schema frozen. Still no
> code, and that is correct.
>
> Then a third and final amendment, after Matt named the requirement outright: *"no hard
> edges so we can grow in any direction at any time"* — the tower that can get taller,
> wider, longer, denser or **deeper into the ground**; the puzzle whose edge pieces always
> have edges left to connect to. Two gaps closed: **`place`** (reserved — **attendance
> evidence for real-world events that happen somewhere**, so *"I was there"* at a beach
> cleanup can be checked rather than claimed; coarse precision by default, opt-in per event,
> only ever on an event that has a `subject`, **no background location ever**, because a
> location trail attached to a medication log is genuinely dangerous) and **`origin`**
> (reserved — `system` + `external_id` gives idempotent re-sync *and* revocability when a
> service is disconnected).
>
> *Scope note:* Pokémon GO / Ingress were cited as **references for things needing GPS**,
> and were briefly misread as a request for location-based *play*. The field was right; the
> justification wasn't. **A map-and-portals game is not a planned direction.** `ECONOMY.md` §2.6 now names **all twelve connectors** and maps them onto
> the tower directions, so "no hard edges" is auditable rather than reassuring. ADR-016.
>
> **All three amendments landed before a line of code existed, which is exactly what
> freezing-before-code buys. From slice 0.2 onward, amendments cost a migration.** The
> honest limit: *structure* is open in every direction; *semantics* are not — meaning must
> stay stable or history stops meaning anything. **Only ever add, never redefine.**
>
> **2026-08-25 (slices 0.2–0.5 + 0.7 — DONE, same day)** — Matt asked for as much to be
> built as possible with as little input from him as possible, so Tier 0 was built out
> rather than stopped after 0.2. `ledger.js` (append-only, preserve-unknown, ULIDs,
> offset-aware timestamps, computed balances), `catalog.json` (33 actions), the app,
> `tests.js` (22 tests, runs in node *and* the browser), export, service worker, manifest.
>
> **Two real bugs the tests caught before any of it shipped**, which is the whole argument
> for writing them first: `newEvent()` silently dropped `cost`, so every purchase would have
> been free; and **Craft had no upkeep-tier action**, which violates "every award reachable
> from bed" — a genuine product bug, found by a test that mechanises a design rule rather
> than checking code. Fixed by adding *Wrote down an idea* and *Learned something small*.
>
> Also built: `tools/doctor.mjs` (an offline health check that includes doc-vs-code drift),
> `tools/catalog-review.mjs` (hands the catalogue to local Qwen through the qwen-tools
> airlock, acquires the GPU lease first, and **proposes without ever editing**),
> `tools/nightly.ps1` + `tools/install-task.ps1` (a scheduled task with a **time-based**
> trigger and `StartWhenAvailable`, deliberately unlike FORGE's at-logon sentinel that has
> died twice).
>
> **Next: slice 0.6 — ship it.** Everything is built. Nobody has it. See `../NEXT.md`.
