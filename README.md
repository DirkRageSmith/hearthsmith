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

**Tier 1 — The First Home. Slice 1.1, the shop.**
<https://dirkragesmith.github.io/hearthsmith/>

Tier 0 is complete. Its gate was revised and met on 2026-08-31 (**ADR-017**): the
three-outside-testers requirement moved to the *end of Tier 1*, where there is a game to
react to rather than a habit tracker. The app runs, the doctor is HEALTHY, and **32 tests**
pass.

**All of it is live as of 2026-08-31 12:40 — fetched, not assumed:** `/`, `/profile.html`,
`/character.js` and `/sw.js` all return **200**, and the served service worker is `v0.3.0`.

Worth keeping for the next person who publishes here: the two new files **404'd for the
first 30 seconds and answered 200 at 40.** A single check would have recorded the wrong
answer, which is precisely what happened to `lesson-looper`'s notes for four days. Poll,
don't peek.

*For a few hours today this section correctly said the opposite — the character system, the
`ragesmith.ledger.v1` migration and the jump to 32 tests were built in one session and sat
uncommitted while the live site served `v0.2.0`. Left in the history because "built" and
"shipped" being different things is the single most expensive lesson in this repo.*

**Verified on real hardware, which is the only verification that counted here.** Matt
installed it on his phone, logged *Got out of bed*, closed the app fully, and reopened it
to find the XP and Embers still there. That mattered because an emulated viewport is not a
phone: FitFlexr's touch handling was completely dead on phones for two weeks while working
perfectly with a mouse.

**Tier 0's distribution requirement did not disappear — it moved.** ADR-017 pushed the
three-testers gate to the end of Tier 1, on the reasoning that asking people to evaluate a
habit tracker with no game in it spends scarce goodwill on the wrong thing. That revision
names its own failure mode: *"wait until it's good enough to show people"* is how a thing
never gets shown, and Tier 1's gate **must not move again.** See [../NEXT.md](../NEXT.md).

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
| 0.6 | **Ship it** | Live on Pages, HTTP 200 verified, on Matt's phone home screen | ✅ **2026-08-31** |
| 0.7 | Export | One button dumps the whole ledger as JSON (ADR-005, non-negotiable) | ✅ **2026-08-25** |
| — | **Tier 0 gate** | Revised and met — ADR-017 moved the three testers to the end of Tier 1 | ✅ **2026-08-31** |
| 1.0 | Character sheet | `character.js` + `profile.html`, computed from the ledger, never stored | ⚠️ **built, not pushed** |
| 1.1 | **The shop** | Spend Embers, the item appears in a room, survives a refresh | ☐ **← current — see [../NEXT.md](../NEXT.md)** |

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
| `tests.js` / `tests.html` | 32 tests. `node tests.js`, or open `tests.html` in a browser. |
| `character.js` | The cross-game character layer — levels, standings, crest. **Computed from the ledger, never stored**, so any future game gets the same character for free. |
| `profile.html` | The character sheet: procedural crest, five trees, and a per-game breakdown that shows the shared world working. |
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
>
> **2026-08-31 — shipped, then the character arrived.** Slice 0.6 closed on hardware. Then
> Matt overruled the three-tester gate, correctly (**ADR-017**): Tier 0 is a habit tracker
> with no game in it, and asking skeptical non-technical friends to review that spends
> scarce goodwill on validating a data model. Distribution moved to the end of Tier 1.
>
> Built the same day, all green at **32 tests**:
> - **`character.js`** — one character across every Ragesmith game, **computed from the
>   ledger and never stored**, so it can never disagree with the events. Every game ships to
>   the same origin, so the shared `localStorage` already makes this work with no server.
> - **`profile.html`** — the sheet. A **procedural crest** with five arms that reach further
>   as each tree grows: deterministic, changes visibly as you do, and needs no art at all.
>   Permanent standings, a calling earned at level 3, and a per-game breakdown that makes the
>   shared world visible.
> - **Ledger moved to `ragesmith.ledger.v1`** (ADR-019). It belongs to the player, not to one
>   game. Migration copies and **never deletes** — two tests pin that.
> - **The Community tree was locked for isolated players** and the old test passed it,
>   because it checked whether a tier was *named* `community` rather than what it *required*
>   (ADR-020). Added `answered_someone` and `left_kind_words`; actions now carry
>   `needs: ["out"|"people"|"money"]`, and every skill must have a solo-reachable one.
>   **Second time a mechanised product rule has caught something real.**
>
> **Next: slice 1.1 — the shop.** Tier 1 is open and Embers finally buy something.
>
> **2026-09-01 (slice 1.1 — DONE, and it is not the shop)** — The shop moved to 1.2 because
> a live bug made it unshippable. Matt asked for *"a real way to update the app regularly"*
> and the service worker turned out to be **cache-first-forever**: `hit || fetch(...)`
> short-circuits, so a cached file never hit the network and the refresh branch never ran.
> The comment above it claimed stale-while-revalidate. **Every update since the worker
> shipped had been silently swallowed**, and reinstalling looked like the only lever — which
> is where an entire thread of wipe-anxiety came from, including a claim ADR-026 had to
> retract. **`hearthsmith@0.4.0`** (ADR-028):
> - **Real stale-while-revalidate.** The fetch starts unconditionally; the cache still
>   answers instantly and the refetch updates it for next launch. Offline-first untouched.
> - **`SHELL_HASH` in `sw.js` + a doctor check that FAILS on mismatch**, reading the file
>   list out of `sw.js` so the two cannot disagree about what the shell is. Check 8 only ever
>   caught "bumped `ledger.js`, forgot `sw.js`"; it could not see a change to `index.html`
>   with neither bumped, which ships nothing and reported HEALTHY.
> - **`NEXT.md` had claimed "the doctor warns if you forget" since Tier 1 opened. It did
>   not.** Now it does. **11 checks**, verified by mutation test rather than by reading it.
>
> **Third time a mechanised rule has caught something real — and the second time the shape
> was a correct-sounding description sitting on code that did something else** (ADR-020 was
> a test checking a label instead of a property). That pattern is worth naming: on this
> machine, the comment is not evidence.
>
> Also this session, all design and no code: **ADR-024/025** froze the stat layer
> (4 derived points per level + a flat +1 to all six every fifth level, no randomness),
> **ADR-026** the character-sheet hub as a lens rather than a layer, **ADR-027** hold-to-
> retract (today's log only, append-only, `kind: "retract"`).
>
> **Next: slice 1.2 — the shop.** Unchanged in substance; renumbered.
>
> **2026-08-29 (slice 0.6 — PUBLISHED, not yet closed)** — Four days passed between "the
> app is built and green" and anybody being able to open it, which is the failure this
> slice exists to break, arriving on schedule. Repo `DirkRageSmith/hearthsmith` created
> **public** via the GitHub MCP (`autoInit:false`), the contents of `hearthsmith/` pushed to
> the **repo root** so `index.html` is top-level, and Pages enabled on `main` / `/ (root)`
> through the REST API (`POST /repos/:owner/:repo/pages`) rather than left as a manual
> click — the `GITHUB_PERSONAL_ACCESS_TOKEN` on this machine is sufficient for it, so
> "Matt has to go and enable Pages" was never true.
>
> **Verified rather than assumed**, because that distinction is the entire point of this
> slice: the URL 404'd for the first ~30 seconds and answered **200 after ~40s**, so the
> first check would have produced exactly lesson-looper's wrong conclusion. All seven
> assets return 200. In a 375×812 viewport the loop runs end to end — tapping *Brushed my
> teeth* wrote one event carrying `v`, a ULID, offset-aware `ts`/`logged_at`, `trust: "T0"`,
> `source: "hearthsmith@0.2.0"`, `subject`/`place`/`origin` present-and-null, and
> `grants: {core:xp 10, core:embers 10, skill:body 1}` — the frozen schema, unmodified, in
> production. Balance computed to 10 Embers, the service worker registered, and the event
> survived a reload.
>
> **Still open, and deliberately not ticked: the phone.** An emulated viewport is not a
> phone, per this repo's own rule. 0.6 closes when Matt installs it, logs one action,
> force-closes and reopens to find it still there. `NEXT.md` stays on 0.6 until then —
> rewriting it to 0.8 now would be the "said live for four days" mistake in a new costume.
>
> **2026-08-31 (slice 0.6 — CLOSED).** Matt installed it on his phone, logged *Got out of
> bed*, closed the app fully and reopened it; the XP and Embers were still there. **Tier 0
> is built, shipped and on a phone.** Two days from "green on this machine" to "running on
> hardware someone owns" — against an eleven-day precedent, which is the number that makes
> the gates worth having.
>
> The slice took two days rather than one because a URL is not a handover, and the doc
> deliberately refused to tick the box until a human confirmed it. Both intermediate states
> were written down as they were true — *published, not closed* — rather than rounded up to
> "live", which is precisely what `lesson-looper`'s entry did for four days and got wrong.
>
> **`NEXT.md` is now slice 0.8, and it contains no code.** Three named people, the URL,
> and one sentence each. It is the step this machine has never once completed on any
> project, so it gets its own slice rather than being assumed.
>
> *Still open and deliberately unfixed:* the iOS `apple-touch-icon` (§ two entries up).
> It only gets fixed if a tester actually trips on it — pre-empting it is how eleven days
> happened last time.
>
> **Two things noticed while verifying, neither fixed** (scope lock — they are Tier 0
> polish, not Tier 0):
> 1. **No `apple-touch-icon` and the only icon is SVG.** Android reads the manifest fine.
>    iOS Safari historically will not use an SVG for the home-screen icon, so on an iPhone
>    "Add to Home Screen" may show a screenshot of the page instead of the flame. Cosmetic,
>    but it is the first impression of whether the thing feels real. A 180×180 PNG plus one
>    `<link>` fixes it — and would need `CACHE` in `sw.js` bumped.
> 2. **Hearthsmith and FitFlexr share the `dirkragesmith.github.io` origin**, so they share
>    one `localStorage`. Both namespace their keys and **neither calls `localStorage.clear()`
>    today** — checked, not assumed — but the day either one does, it silently wipes the
>    other's data. Worth knowing before a third PWA lands on the same origin.
>
> **2026-09-01 (slice 1.2 — DONE) — the shop, and the first room.** The tier's actual
> hypothesis, shipped: **you can spend Embers on something, see it appear in a room, and it
> is still there after a refresh.** Verified by doing it in a browser, not by reasoning
> about it. `hearthsmith@0.5.0`.
>
> - **`shop.json`** — 12 items across all five trees, each gated by a skill level and
>   priced in Embers. Cheapest is **900**, about one good week per ECONOMY §3; a test
>   enforces the floor, because a pricing rule erodes one reasonable discount at a time.
> - **`shop.js`** — the projection layer. **There is no inventory.** What you own is the set
>   of `spend` events carrying an `item`, derived on read, exactly like every balance. An
>   export therefore already carries the whole room, a two-device merge is still a union by
>   id, and a 2031 tool that never heard of this shop can still show what you built.
> - **`room.html`** — twelve slots, hand-authored inline SVG sprites, empty slots drawn
>   faintly so the room says *there is room for more* rather than *you have nothing*.
>   **No art licence question at all** — Kenney (CC0) is still the answer when real art is
>   wanted, and the LimeZu pack is still non-commercial and still unusable.
> - **Buying takes two taps.** Nothing built is ever taken back (§4 rule 2), which is a
>   kindness everywhere except a mis-tap that spends three weeks of Embers — and retraction
>   cannot help there, since it corrects what you *did*, not what you *chose to buy*. The
>   confirm disarms itself after 4.5s so it never sits waiting to be brushed.
>
> **THE SCHEMA WAS FOUND WRONG — ADR-029, and ADR-017's gate clause is now closed.**
> `newEvent()` attached `verb` and `skill` unconditionally. `JSON.stringify` drops undefined,
> so a `spend` carried them in memory and lost them on save: the same event answered
> `"verb" in ev` two different ways depending on whether it had been through storage. The
> byte-stability test passed the whole time — the bytes really were stable — because it had
> only ever run on `earn` events, where the two shapes coincide. **ROADMAP predicted both
> that this would happen and where**: the shop, the first code that reads the ledger rather
> than appending to it. Fixed, documented in ECONOMY §2, pinned by a test.
>
> **Three smaller things found while verifying, all fixed:**
> 1. **"Today" counted purchases.** It is presented beside Embers and XP as a count of what
>    you did; the first buy would have quietly incremented it. Now counts `earn` only.
> 2. **The harm-rule doctor check named its pages by hand.** Adding `room.html` shipped a
>    page of new player-facing copy that no harm rule applied to, while the check went on
>    reporting ok about two files. It now reads the page list out of `sw.js`'s `SHELL`, the
>    same trick check 9 uses — *watched fail*: guilt copy added to `room.html` turns it
>    UNHEALTHY, removing it returns HEALTHY.
> 3. **`button.ghost` never matched the toolbar links.** The *character* link had been
>    rendering as default-blue underlined browser text at no minimum tap size since
>    `profile.html` shipped. Selector is now `.ghost`.
>
> **44 tests, doctor HEALTHY at 11 checks.** Eight deliberate sabotages of the new shop
> rules were each confirmed to fail the suite before being restored — a check nobody has
> watched fail is not a check.
>
> **Could not verify: the service worker.** Registration fails in the in-app browser used
> for testing (`An unknown error occurred when fetching the script`) — the file serves 200
> with `text/javascript`, so this is the test browser, not the code. `CACHE`, `SHELL` and
> `SHELL_HASH` are correct per the doctor, but **the offline behaviour of `room.html` and
> `shop.json` has not been observed on a real device.** First thing to check on the phone.
>
> **2026-09-01 (slice 1.3 — DONE) — the room became a room.** `hearthsmith@0.6.0`.
>
> **This was not the planned slice.** 1.3 was going to be hold-to-retract (ADR-027).
> Matt sent a screenshot of a pixel-art city builder mid-session and asked what it would
> take to get somewhere near it, and the honest answer was that the ledger work was
> already done and the *visuals* were the thing standing between him and something he
> could react to. Retract and the stat layer are both still fully specified and both
> moved down; neither expires.
>
> - **`tiles.js` — the art seam, and the reason this slice is cheap to redo.** Sprites
>   are 16×16 grids of characters indexed into a palette; they emit as SVG rects with
>   runs merged. Real pixel art, diffable in git, no binary, no download, and **no
>   licence question**. Swapping to a bought tileset means replacing this one module
>   with one that returns spritesheet slices under the same names — the renderer, the
>   shop and the ledger do not change. Kenney (CC0) remains the decided first swap.
> - **31 sprites**: hearth, stove, sink, counter, table, pantry, bed, nightstand,
>   wardrobe, sofa, armchair, rug, plant, bookshelf, desk, workbench, toolrack, window,
>   curtains, sconce, picture, shelf, clock, door, mirror, guest chair, mat, plus wall,
>   wainscot and two floor boards.
> - **`shop.json` v2** — a real 16×10 tile grid instead of twelve boxes. Rows 0–3 wall,
>   4–9 floor. **26 items** (the 12 shipped ones keep their ids, labels, skills and
>   prices untouched; 14 are new). Six floor cells are deliberately left empty and draw
>   as faint outlines, so the room reads as *there is room for more*.
> - **The hearth is a fixture** — never bought, never lost, always drawn. An empty room
>   on day one reads as a punishment for being new.
> - **The room does not follow the UI theme.** A room is a place, and a place does not
>   change colour because the phone did. Its warmth comes from the hearth light, whose
>   reach is driven by the same ledger-derived `warmth()` as the flame on the front
>   page — it never reads a clock and it never goes out.
>
> **Two art mistakes worth recording, because both looked fine in source and wrong on
> screen.** The first floor tile packed three planks into every sixteen pixels, so the
> seams were denser than anything standing on them and it read as **brickwork**. The
> fix over-corrected: giving every tile its own end-joint put a join every sixteen
> pixels in both directions and it read as **panelling**. Only the second variant
> carries an end-joint now, so joins land every thirty-two pixels, staggered. *Neither
> was visible until it was rendered at size and looked at* — the sprite sheet at thumb
> size looked correct both times.
>
> **A doctor check for the tileset (check 5b, now 12 checks).** A mistyped palette
> character is not an error at any level: that pixel is simply transparent, and the
> sprite comes out with a hole in it. A Cyrillic `о` pasted into the mirror had already
> done exactly that. It also verifies every sprite the shop names actually exists —
> otherwise a purchase takes the Embers and changes nothing visible, which is
> indistinguishable from a broken buy. **All four failure modes were watched failing.**
>
> **`shop.json`'s v1 header claimed `slot` was frozen alongside `id`. That was an
> over-claim and is corrected in the v2 header** — a cell is not stored in any event,
> so rearranging the room is a layout change, not a migration. Freezing it would have
> meant the room could never be redecorated, which is the opposite of the product.
>
> **49 tests, doctor HEALTHY at 12 checks.** New tests cover overlap and out-of-bounds
> placement, sprites existing, draw order (rugs, wall, then floor back-to-front), the
> room never being empty, and the room never being completely full.
>
> **Still not verified: the service worker**, unchanged from 0.5.0. The in-app test
> browser refuses to register one; the file serves 200 as `text/javascript`. First
> thing to check on the phone.

> **2026-09-01 (slice 1.4 — DONE, unpushed) — hold to retract.** `hearthsmith@0.7.0`.
> Built by an unattended Bellows pass, following ADR-027 / ECONOMY.md §2.8 exactly — no
> design decisions in this one, only implementation, which is why a pass could do it.
>
> - **A new event kind, `"retract"`, carrying `subject` (the id it corrects) and nothing
>   else.** `ledger.js` stays append-only; nothing is edited or deleted.
> - **`balances()` now looks up a retraction's subject and subtracts its `grants`.** A
>   dangling subject (not in this ledger) subtracts nothing and does not throw.
>   **`core:embers` floors at zero** — a retraction can shrink an already-spent balance
>   down to the floor, never below it, and never claws back what was bought.
> - **`highWaterBalances()` is new**: replays events in `id` order and tracks the peak
>   each currency's running total ever reached. Skill levels, calling, and standings all
>   read this instead of the live balance, so **a same-day correction can never take back
>   a level, a calling, or a title already earned** — only the raw XP/Embers counters (an
>   honest record, not a trophy) actually move. `shop.js`'s unlock gate reads the same
>   high-water value, so nothing already unlocked can re-lock itself mid-purchase.
> - **`visibleEvents()` is new**: a retraction and whatever it retracted are never shown
>   as themselves. The main page's log, today's count, this month's day count, the hearth's
>   warmth, and the character sheet's action/day/most-logged tallies all read this instead
>   of the raw ledger — a corrected mis-tap does not linger anywhere as a phantom entry.
> - **Hold, don't tap, and only today's own actions** — a purchase in the room can't be
>   held from the main page. ~650ms via `pointerdown`/`pointermove`/`pointerup`, cancelled
>   on a 10px drift so a scroll never fires it by accident. `L.canRetract()` is the actual
>   rule (today's local day only, ECONOMY §2.8's whole design); the UI only decides which
>   entries get the affordance, and it is checked again at the moment of retraction.
> - **13 new tests, 62 total, doctor HEALTHY at 12 checks.** Each guard was watched
>   failing before the code that makes it pass existed — `KNOWN_KINDS`, `balances()`,
>   `canRetract()`, the high-water skill level, and the standing-never-lost case all ran
>   red first. One real bug caught by this: the first version of the high-water tests
>   built several events in the same tick, and a ULID only sorts by time to millisecond
>   resolution — same-millisecond events don't reliably sort in creation order. Fixed in
>   the *test* (explicit, strictly-increasing ids), not in `highWaterBalances()`: real
>   usage never collides like that — a hold gesture alone takes hundreds of ms.
>
> **Unpushed, on purpose.** `hearthsmith` is a public repo and an unattended pass may
> never push to one (the rope is enforced by the wrapper, not by instruction). Everything
> above is committed on a local branch, `bellows/hold-to-retract`, sitting on top of the
> commit `main` was at when the pass started. `main` itself is untouched. Review with
> `git -C hearthsmith log main..bellows/hold-to-retract` and
> `git -C hearthsmith diff main..bellows/hold-to-retract`, then merge and push when ready
> — nothing reaches the live site, and `ledger.js` keeps reporting `hearthsmith@0.6.0` at
> `dirkragesmith.github.io`, until that push happens.
