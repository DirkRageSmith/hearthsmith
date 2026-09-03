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
>
> **2026-09-02 — slice 1.4 REVIEWED, merged and shipped.** `hearthsmith@0.7.0` is live.
>
> The build itself was done on 2026-09-01 on a `bellows/` branch and deliberately left
> unmerged, with review named as an explicit precondition for slice 1.5. **That was the
> right call** — the review found two real bugs, both in behaviour no test covered.
>
> 1. **Retraction was not idempotent, and `core:xp` went negative (−10).** Retracting the
>    same event twice subtracted twice. `currencies.json` makes exactly one promise about
>    XP — *only ever goes up, never spent, never lost* — and a negative number is strictly
>    worse than a falling one. **The input is not exotic: ADR-023's whole value is that two
>    ledgers merge by union by `id`, and that only holds if every `kind` is idempotent
>    under union.** Two devices each correcting the same mis-tap produce exactly this.
>    Not reachable through the UI (a retracted entry is hidden, so it cannot be held
>    twice) — reachable through the *merge*, which is worse, because nobody watches that
>    path. Now ECONOMY §2.8 rule 5.
> 2. **The window was keyed on `ts`, so a backfilled action could not be corrected.**
>    ADR-027 says *"logged today"*; backfill writes `ts`=yesterday with `logged_at`=today,
>    so the window excluded the likeliest mis-tap there is. Now on `logged_at`. An action
>    both logged *and* dated yesterday is still closed.
>
> **The test that should have caught #2 passed throughout.** It backdated only `ts`, so it
> was really asserting that an action backfilled minutes ago is closed — testing the wrong
> property to reach the right-looking result. **Fifth instance of the one failure mode this
> project keeps hitting:** a check that looks right and measures something adjacent
> (ADR-020, ADR-028, ADR-029, the floor tiles, this).
>
> Three tests added, watched failing first; both fixes then re-broken and watched failing
> again. The hold tooltip changed from *"for a mis-tap, not for a bad day"* to **"Hold to
> undo a mis-tap"** — the first is true of the design and wrong as shipped copy, because it
> tells someone their reason for correcting their own log is being judged.
>
> **65 tests, doctor HEALTHY at 12 checks.** Verified in a browser rather than reasoned
> about: held a backfilled entry, it left the list, XP went 85 → 60, the Home level stayed
> at 1, all seven `earn` events were still on disk with one `retract` appended, and a
> refresh agreed. No "corrected", "correction" or "mistake" appears anywhere on the page.
>
> **A process note worth keeping.** `hearthsmith` is a separate repo *and* this work was on
> a branch, so `git push origin main` reported **"Everything up-to-date"** while the slice
> sat unshipped — `main` really was current; `HEAD` was somewhere else. **"Up-to-date" is
> not the same claim as "your work is live."** Check `git branch --show-current` before
> believing a push, and check the live asset after.
>
> **2026-09-02 (Bellows pass) — slice 1.5, the stat layer (ADR-024/ECONOMY.md §6), built
> whole.** STR/VIT/SPD/AGI/DEF/LUK now accrue silently from every event — ledger only, no
> UI, exactly as the slice specified. `hearthsmith@0.9.0`.
>
> **What was built.** Six `stat:*` currencies registered in `currencies.json` under a NEW
> fourth class, `"stat"` — not a fourth `core` currency (that class is closed at exactly
> three) and not `skill` (a stat never gates a purchase). `only_buys` phrased as permission
> and qualification, matching `skill:*`'s shape, never payment. Every action in
> `catalog.json` gained a `stat` field: `tier === "upkeep"` always feeds `spd`, overriding
> the skill below it; every other tier maps by skill (`body`→str, `kitchen`→vit,
> `craft`→agi, `home`→def, `community`→luk) — resolved at log time so a future retune of
> this table cannot rewrite what an old event already meant (ADR-012's precedent). A new
> `characterCost()`/`characterLevelFor()` pair lives in `ledger.js` alongside `levelFor()` —
> the character-level curve from §6 (`300 × 1.016390^(n-1)`, flat 1500 past level 100),
> deliberately not a repurposing of `levelFor()`, which is the unrelated skill-tree curve
> that gates the shop. The split itself — 4 points per level-up by largest remainder, +1 to
> all six on a milestone level — lives in a new sibling module, `stats.js`: `character.js`'s
> own header says extract it when game #2 ships, so the stat layer didn't have to wait on
> that extraction to exist.
>
> **One arithmetic trap found by working the acceptance test, not by reading NEXT.md.** The
> milestone formula is `floor((L-1)/5)`, correctly resolved by the previous session from
> ADR-024's worked example. But that same document's own illustrative gloss — *"i.e. levels
> 5, 10, 15"* — is wrong, and its "off-by-one" warning points the wrong direction. Landing
> the milestone at 5/10/15/… gives **6** milestones by level 30 (152 points), not the
> required 146. The formula only reproduces the mandated totals (146 at level 30, 510 at
> level 100) when the milestone lands at **L ≡ 1 (mod 5), i.e. 6, 11, 16, 21, 26, …** —
> confirmed by mutating the comparison to `floor(L/5)` and watching both the milestone test
> and the worked-example test fail for exactly this reason, then reverting. The formula
> shipped is the one that matches the required numbers; the prose gloss is the thing that
> was wrong, and this entry is the correction since `NEXT.md` gets rewritten, not fixed in
> place.
>
> **The vendoring seam (ADR-022, doctor check 10) held on the first real test.** Changing
> `ledger.js` and `currencies.json` immediately failed "vendored ledger" until the same
> byte-identical copies were re-written into FitFlexr (`C:\Users\regan\projects\swipefit`).
> Re-copied and reverified HEALTHY. FitFlexr's working tree had five other files already
> modified and uncommitted (not this pass's), left exactly as found — only `ledger.js` and
> `currencies.json` were touched or committed there.
>
> **74 tests (was 65), doctor HEALTHY at 13 checks.** New coverage: the catalogue's
> `stat` field matches the resolved mapping mechanically (so a future action can't drift
> from the rule silently), the six stat currencies are registered, `validate()` accepts a
> registered `stat:*` key and rejects an unregistered one, largest-remainder always sums to
> exactly the requested total, the milestone lands at the right levels and nowhere else, a
> stat total is a pure function of the ledger (same in, same out, twice), a total never
> falls as more events are added — retraction included — and the worked example's two exact
> numbers reproduce from a synthetic ledger built out of the real catalogue. Manually
> verified beyond the suite too: 8 `shower` events (320 xp) through the real storage path
> crossed into character level 2 and produced exactly 4 STR, 0 elsewhere.
>
> **Deliberately not built:** any UI (§6 says outright nothing shows this yet), the
> character-sheet hub (ADR-026, comes after), per-game spending of stats (§6: each game's
> own call), parties and bonded pairs (ADR-024 Q9, still open).
>
> **Unpushed, on purpose** — same shape as 1.4. `hearthsmith` is a public repo; committed to
> a local branch, `bellows/stat-layer`, on top of the commit `main` was at when this pass
> started. `main` is untouched. `dirkragesmith.github.io/hearthsmith/ledger.js` keeps
> reporting `hearthsmith@0.8.0` until this is reviewed and merged.
>
> **2026-09-02 — slice 1.5 REVIEWED and merged.** `hearthsmith@0.9.0` live. Checked by
> probing rather than reading: the ADR-024 worked example reproduces exactly (146 points at
> level 30, 510 at level 100); `levelFor()` was correctly left alone with
> `characterLevelFor()` added beside it; the sheet is pure (same ledger twice, identical
> output); and after a retraction `core:xp` fell 1600 → 1560 while the character level and
> all six stat totals held — the high-water rule surviving contact with the kind 1.4 added.
> Nothing multiplies grants by a stat and no stat path mints Favor.
>
> **ECONOMY §6's prose was wrong and is now corrected.** It said the milestone lands "on
> levels 5, 10, 15". It does not — `floor((L-1)/5)` increments at **6, 11, 16, 21**. Read
> as `floor(L/5)` the totals come out 152 and 522 instead of the frozen 146 and 510. The
> formula was never in doubt; where it lands was. Verified independently by solving for the
> milestone count from ADR-024's own totals rather than trusting either the prose or the
> pass that reported it.
>
> **A guard that was green while the thing it guards was false.** The doctor's `vendored
> ledger` check compares two *working trees*. Both were sitting on an unreviewed feature
> branch, so they genuinely matched and it said ok — while FitFlexr's live site served a
> `ledger.js` from that branch and Hearthsmith's live site served the previous release. A
> `git add -A` in FitFlexr had swept the re-vendored files into an unrelated commit and
> pushed it to `gh-pages`. No user-visible breakage, but unreviewed code reached a live
> site. **The check now names the ref it compared and warns when it is not `main`** — same
> failure family as the CRLF shell hash: an answer that depends on incidental local state
> rather than on the thing being asserted. Vendored files now also get their own commit.
>
> **2026-09-02 (0.10.0) — the aesthetic is frozen: 16-bit JRPG (ADR-030).** Matt's call —
> Super Mario RPG, EarthBound, Final Fantasy Mystic Quest. What those three share is not
> subject matter but four properties of *rendering*: hue-shifted shading (shadows toward
> purple, highlights toward yellow — the biggest single lever), an outline that is never
> pure black, high saturation with wide value steps, and the thick-bordered menu window.
>
> **Only the 26 palette values changed. Not one sprite.** All 91 grids index into the same
> frozen letters, so the whole look moved by editing a colour table — `tiles.js`'s art seam
> paying for itself the first time anyone leaned on it. `room.html` gained the frame (plum
> outline, gold bevel, square corners) and **stopped following the OS theme** — required,
> not preference: shop rows on a dark frame fill would have had light-mode dark-on-dark
> text.
>
> **The IP line is written into ADR-030 explicitly.** Style is not protected; expression
> is. Their sprites, characters, names, music, frames-as-drawn and text are permanently
> out. The test: *could a reasonable person identify a specific game from this asset
> alone?* If yes, it is out.
>
> **2026-09-02 (0.11.0) — EarthBound perspective and the moving background.** Matt narrowed
> the direction; EarthBound is now primary and decides how the world is drawn.
>
> **The floor was the whole perspective problem, and the fix was 32 lines.** Through three
> revisions it was horizontal boards running across the screen. **Horizontal boards are a
> side view** — they describe a surface facing you, so the floor read as a second wall and
> the furniture looked pasted onto it. The first two attempts fiddled with seam density
> (brickwork, then panelling) because the symptom was read as *texture* when it was
> *projection*. Square parquet with the grain rotating 90° per tile reads as horizontal
> instead; alternating grain is what the eye uses to decide a surface is a floor.
> EarthBound is **oblique, not isometric** — above the floor and in front of the wall at
> once — which is why "pick one of the three" was never coherent, since SMRPG genuinely is
> isometric.
>
> **The trippy background is an algorithm, which is why it is safe.** EarthBound's battle
> backgrounds were two pattern layers warped per scanline by HDMA, drifting against each
> other while the palette cycled. The *method* belongs to the medium; the patterns are
> theirs and are not used. Rebuilt as two counter-drifting gradient fields under a slow hue
> rotation, pure CSS — no image, no library, no shell file.
>
> **Its intensity is a harm-rules decision, not a default.** EarthBound put this in
> *battle* — a moment, not a state. Full strength behind a page someone opens at 2am to
> tick "brushed my teeth" would be hostile. So: quiet behind the room, **loud on the
> character sheet**, which is this game's version of stopping to look at who you are.
> `prefers-reduced-motion` keeps the colour and drops the movement — hiding it would hand
> anyone with that preference a different app rather than a calmer one.
>
> **Not done, and not pretended otherwise:** a scrolling camera (a room larger than the
> screen is a real feature, not polish), oblique tops on furniture (the other half of the
> perspective read — this is slice 1.6), and any sprite pass toward "cutesy". The sprites
> are simple; they are not charming yet.
>
> **2026-09-02 (0.12.0) — you are in the room.** The step from "an app with a picture of a
> place" to "a place". Three pieces: a body that occupies a tile, movement that respects
> what is already in the room, and **looking** — stand in front of a thing and get a
> sentence about it. Tap to walk, tap what you're facing to look; arrow keys on a desktop.
>
> **The writing is the point.** All 26 items and the hearth carry an `examine` line, and
> the voice rules are recorded in `shop.json` because they are product rules rather than
> style: second person, present tense, notice something *specific*, and **never
> congratulate the player for taking care of themselves.** Not once, not warmly, not as a
> reward — being scored on self-care is what makes people put an app down (ADR-006,
> ECONOMY §4), and *"you earned this!"* is that failure wearing a compliment. Usually the
> second sentence does the work: the first says what the thing is, the second says what
> changed because you have it.
>
> **THE ROOM WAS UNINHABITABLE AND NOBODY COULD HAVE KNOWN.** With everything bought, four
> of the six floor rows were completely blocked — you were penned into a bottom strip and
> could never reach the back wall or anything hanging on it, inside your own home. Nothing
> was *wrong* with the data. The layout had been designed as a **picture**, where density
> looked good, and it had never been asked to be somewhere a person stands.
>
> **The first fix was also wrong, and that is the more useful half.** Adding walkway rows
> made every row individually clear — and left three parallel corridors with no way
> between them, because each furniture band still spanned the full width. It passed the
> obvious check ("is this row clear?") while the room was still three sealed strips. The
> room is now 20 columns with gaps aligned at columns 9 and 19, and the test **floods the
> floor from a corner** instead of inspecting rows, because **connectivity is the actual
> rule and "each row is fine" is a proxy that was true of a broken room.** That is this
> project's recurring failure — a check measuring something adjacent — in its sixth
> costume.
>
> *The flood fill was verified against a constructed partition (18 tiles stranded when
> sealed, 0 with one gap), because the obvious sabotage of the real room kept leaving a
> corridor open and passing — a sabotage that silently no-ops looks exactly like a check
> that works.*
>
> **75 tests, doctor HEALTHY at 13 checks.** Verified by playing it: walked the corridor
> from the front of the room to the back wall and looked up at the picture, which was
> impossible an hour earlier.
>
> **2026-09-02 (0.13.0, Bellows pass) — slice 1.7, option 1: the hearth talks back.** NEXT.md
> offered three alternatives for "give the room something to be walked *to*" and recommended
> "1, then 2." Built 1: the hearth's dialogue line is no longer the one fixed sentence in
> `shop.json` — standing in front of it and looking now reads two clauses, warmth first
> (four bands, reusing `room.html`'s own already-shipped thresholds and vocabulary from
> `index.html`'s hearth label — *banked / glowing / warm / burning bright* — rather than
> inventing new language for a state the app already names elsewhere) and then what's built
> around it (bare / one thing / a few things / surrounded). **Costs no new state**, exactly
> as the slice asked: both numbers were already computed every render (`warmth()` for the
> light, `S.owned(events).length` for the "built so far" counter), this just reads them a
> second time for a fixture that used to be static.
>
> All 16 combinations were checked against the dialogue box's own 3-line wrap (`wrapText`,
> 46 chars/line) before shipping — the first draft of the "warm" and "glowing" clauses
> overflowed to a 4th line on three of the sixteen pairings, which the box silently drops
> rather than failing loud. Shortened until every combination fit; verified with a small
> node script running the real `wrapText()` against all 16 pairs, not by eyeballing the
> longest-looking one.
>
> **`ledger.js`'s `SOURCE` moved to 0.13.0** even though nothing about the ledger's own logic
> changed — this project's convention ties the shipped version, the service-worker cache and
> `SOURCE` together, and the version string lives inside the vendored file. Re-copied
> byte-identical into FitFlexr per ADR-022 (check 10 caught the drift immediately, as
> designed) and committed there separately from `hearthsmith`'s own commit.
>
> **Option 2 (oblique tops on furniture) is still open** — NEXT.md called it "pure craft, no
> design left," so it becomes the next slice rather than sitting as a candidate again.
> **75 tests unchanged** (no new ledger logic, no new event kind), doctor HEALTHY at 13
> checks, `hearthsmith@0.13.0`.
>
> **Unpushed on purpose**, same shape as every prior Bellows slice: `hearthsmith` is public
> and OPERATING.md forbids a pass from pushing one. Committed to a new local branch,
> `bellows/hearth-talks-back`, one commit on top of the `main` this pass started from — see
> `bellows/HANDOFF.md` for what to check before merging.
>
> **2026-09-03 (Bellows pass, 0.14.0) — slice 1.8, oblique tops on furniture.** `NEXT.md`
> asked for all seventeen `layer:"floor"` sprites (plus the hearth) to stop reading as flat
> stickers on the oblique floor ADR-030 shipped in 0.11.0. The rule applied, uniformly and
> mechanically rather than sprite-by-sprite taste: **the topmost non-outline row of an
> object's body must already be that material's existing palest/highlight palette tone**
> (`e` for wood, `u` for metal, the cushion's own `f` cream reused as a rim on cloth-topped
> backs where the palette has no lighter cloth tone) — recolour it if it is not, leave it if
> it already is. **10 of the 17 needed a change** (`hearth`, `pantry`, `bed`, `nightstand`,
> `wardrobe`, `sofa`, `armchair`, `bookshelf`, `toolrack`, `guestchair`); **7 already had it**
> (`stove`, `sink`, `counter`, `table`, `desk`, `workbench`, `plant` — the last because leaf
> `n` has no lighter sibling in the palette at all, so there was nothing to reach for without
> adding a key, which the slice's own rule forbids). No grid changed size, no key was
> renamed, no new palette entry was added — verified by running the real `sprite()` function
> against all 17 names from Node (grid still 16×16, every character still a real `PALETTE`
> key), since no browser tool exists in this session to actually look at it.
>
> **A real process mistake, caught before it was committed, worth recording.** `hearthsmith`
> was still checked out on the unmerged `bellows/hearth-talks-back` branch from the previous
> pass when this one started editing `tiles.js` — so the first ten edits landed on top of
> slice 1.7's branch instead of on `main`, which `NEXT.md` explicitly says this slice must
> not depend on. Caught by running `git branch --show-current` before committing anything,
> not by assuming the working tree matched the read-order docs. Fixed by reverting the
> working-tree edits with the editor (not `git checkout --`, which this session's rope
> denies), confirming `git diff main bellows/hearth-talks-back -- tiles.js` was empty so the
> revert-and-redo was safe, then branching fresh from `main` as `bellows/oblique-tops` and
> reapplying the same ten edits there.
>
> **The version number collides with 1.7's, and that is now Matt's to resolve, not a pass's.**
> Both `bellows/hearth-talks-back` (`hearthsmith@0.13.0`) and this branch
> (`hearthsmith@0.14.0`) start from the same `main` at `0.12.0` and both bump `ledger.js`'s
> `SOURCE`, `sw.js`'s `CACHE`, and `SHELL_HASH` — two independent bumps of the same line from
> the same base, which git will flag as a merge conflict on that one line whichever branch
> is merged second. That conflict is correct, not a bug to route around: it forces whoever
> merges second to pick the final number and re-run `tools/doctor.mjs` for the real
> `SHELL_HASH`, rather than one branch silently overwriting the other's version bump.
> **Not re-vendored to FitFlexr this pass.** `swipefit`'s `ledger.js` currently carries
> 1.7's unpushed 0.13.0 re-vendor; overwriting it with this branch's 0.14.0 would make the
> vendored copy match neither branch that is actually reviewed yet. `tools/doctor.mjs`'s
> "vendored ledger" check therefore reports **FAIL, not warn**, when run from `main` (unlike
> the WARN it gave on the 1.7 branch, where the vendored copy does match) — a real,
> pre-existing consequence of two unmerged sibling branches touching a shared vendored file,
> not a fresh defect from this pass's sprites. Whoever merges 1.7 and/or 1.8 should do one
> final FitFlexr re-vendor afterward, once there's a single settled version number.
>
> **75 tests, unchanged** (no ledger logic touched). **Doctor: 12 ok, 0 warn, 1 fail** — the
> vendored-ledger fail above, expected and explained; every other check green, including
> `tileset` (still 37 sprites, all 16×16) and `shell hash` (12 shell files match v0.14.0,
> converged after two recomputations for the same reason ADR-028's note already
> describes — `SHELL_HASH` lives inside `sw.js`, which is not itself one of the hashed
> shell files, so this is not the self-referential loop it first looks like; the first
> "recomputation" was actually still catching up to the *previous* edit, not to itself).
> **Not verified: what any of this looks like.** No browser or screenshot tool was available
> in this unattended session, so — same caveat as 1.7's — this needs the two-minute phone
> check before merging: walk to a few of the ten changed pieces and confirm the highlight
> reads as a lit top surface and not a smear.
>
> **2026-09-03 (0.14.0, merged and reviewed) — 1.7 and 1.8 are live, and they were looked
> at.** Both branches merged linearly (1.7 fast-forward, 1.8 rebased on top, keeping a
> history with no merge commits) and pushed; Matt reviewed the result in a browser and it
> reads correctly. **That closes the "not verified" caveat above** — which both passes were
> right to leave open rather than close on logic checks alone.
>
> **`SHELL_HASH` could not be taken from either branch, and that is the transferable part.**
> 1.7 changed `room.html`, 1.8 changed `tiles.js`, so the merged shell hashed to a third
> value neither branch had recorded (`c34480ad2bf9b01c`). When two branches both touch shell
> files, that conflict resolves by **recomputing** from `tools/doctor.mjs`, not by picking a
> side — a "pick one" resolution here would have shipped a hash matching neither tree and
> left the service worker serving a stale shell, silently, which is the exact failure
> ADR-028's check exists to prevent.
>
> **This file conflicted too, and the resolution was keep-both.** Both passes appended a
> "Where I stopped" entry at the same anchor. This section is append-only history, not a
> version marker, so picking one would have destroyed a pass's record.
>
> **Still open, and not covered by the browser review: the service worker on a real phone**
> (unverified since 0.5.0). `CACHE` moved `v0.12.0` → `v0.14.0`, so an already-installed
> device either picks the update up or visibly does not — the best chance yet to settle it.
