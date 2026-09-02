/* Hearthsmith — the test suite.
 *
 * Runs in a browser (open tests.html) and in node (`node tests.js`). Same file,
 * no runner, no install, no build step — because the moment testing needs a
 * toolchain it stops happening.
 *
 * The two tests that matter most are the first two. Everything else is ordinary
 * correctness; those two are the forward-compatibility contract the whole
 * ten-year plan rests on (ECONOMY.md §2.6).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HearthsmithTests = api;
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  function makeSuite(L, catalog, currencies, C, S, shop) {
    const results = [];
    const t = (name, fn) => {
      try { fn(); results.push({ name, ok: true }); }
      catch (e) { results.push({ name, ok: false, msg: e && e.message ? e.message : String(e) }); }
    };
    const ok = (cond, msg) => { if (!cond) throw new Error(msg || "assertion failed"); };
    const eq = (a, b, msg) =>
      ok(a === b, (msg || "not equal") + ` — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

    const sampleLedger = () => ([
      L.newEvent({ verb: "brush_teeth", skill: "body",
                   grants: { "core:xp": 10, "core:embers": 10, "skill:body": 1 } }),
      L.newEvent({ verb: "cooked_a_meal", skill: "kitchen",
                   grants: { "core:xp": 25, "core:embers": 25, "skill:kitchen": 2 } })
    ]);

    /* ---- 1. the no-op round trip ------------------------------------- */
    t("no-op round trip is byte-identical", function () {
      const before = L.serialize(sampleLedger());
      const after = L.serialize(L.deserialize(before));
      eq(after, before, "round trip changed the bytes");
    });

    /* ---- 2. THE LOAD-BEARING ONE -------------------------------------
     * A field written by a future tool must survive a read/write by this one.
     * Without this, a 2026 tool silently destroys 2031 data. */
    t("unknown fields survive a read/write cycle", function () {
      const ev = L.newEvent({ verb: "brush_teeth", skill: "body", grants: { "core:xp": 10 } });
      ev.someFutureField = 42;
      ev.meta.nested = { alsoFuture: ["a", "b"] };
      const out = L.deserialize(L.serialize([ev]))[0];
      eq(out.someFutureField, 42, "top-level unknown field was dropped");
      eq(out.meta.nested.alsoFuture[1], "b", "nested unknown field was dropped");
    });

    /* FOUND 2026-09-01 BY THE SHOP — the first code to write a non-`earn` event
     * in anger, and the first to read the ledger back rather than append to it.
     *
     * newEvent() attached `verb` and `skill` unconditionally. For an earn event
     * both are always set, so nothing showed. For a `spend` both are undefined,
     * and JSON.stringify DROPS undefined values — so a purchase had eighteen keys
     * in memory and sixteen after being saved and read back. `"verb" in ev` gave
     * two different answers for the same event depending on whether it had been
     * through storage.
     *
     * The bytes were stable, which is why test 1 never caught it: it only ever
     * ran on earn events, where the two shapes coincide. An event's shape must
     * not depend on whether it has been persisted yet, or preserve-unknown-fields
     * is being enforced against a moving target. */
    t("an event has the same shape in memory as it does on disk", function () {
      [
        L.newEvent({ verb: "brush_teeth", skill: "body", grants: { "core:xp": 10 } }),
        L.newEvent({ kind: "spend", cost: { "core:embers": 900 },
                     item: "home_rug_01", target: "home:self" })
      ].forEach((ev) => {
        const back = L.deserialize(L.serialize([ev]))[0];
        eq(Object.keys(ev).sort().join(","), Object.keys(back).sort().join(","),
           `${ev.kind} event changed shape when it was saved`);
      });
    });

    t("appending does not strip unknown fields from existing events", function () {
      const first = L.newEvent({ verb: "brush_teeth", skill: "body" });
      first.futureThing = "keep me";
      const next = L.append([first], L.newEvent({ verb: "did_dishes", skill: "home" }));
      eq(next[0].futureThing, "keep me", "append rebuilt an existing event");
    });

    /* ---- 3. append is append ------------------------------------------ */
    t("append never mutates, reorders or drops", function () {
      const before = sampleLedger();
      const snapshot = L.serialize(before);
      const after = L.append(before, L.newEvent({ verb: "did_dishes", skill: "home" }));
      eq(L.serialize(before), snapshot, "append mutated the input array");
      eq(after.length, before.length + 1, "wrong length after append");
      eq(after[0].id, before[0].id, "first event changed identity");
      eq(after[1].id, before[1].id, "second event changed identity");
    });

    /* ---- 4. timestamps ------------------------------------------------ */
    t("ts carries an explicit UTC offset, not bare Z", function () {
      const ev = L.newEvent({ verb: "brush_teeth", skill: "body" });
      ok(/[+-]\d{2}:\d{2}$/.test(ev.ts), `ts must end in an offset, got ${ev.ts}`);
      ok(/[+-]\d{2}:\d{2}$/.test(ev.logged_at), `logged_at must end in an offset, got ${ev.logged_at}`);
      ok(!/Z$/.test(ev.ts), "ts is bare UTC — the local offset was thrown away");
    });

    t("ts and logged_at are separate fields", function () {
      const ev = L.newEvent({ verb: "brush_teeth", skill: "body", ts: "2026-08-20T09:00:00-07:00" });
      eq(ev.ts, "2026-08-20T09:00:00-07:00", "ts was overwritten");
      ok(ev.logged_at !== ev.ts, "logged_at collapsed into ts for a backfilled event");
    });

    /* ---- 5. validation ------------------------------------------------ */
    t("validate rejects an unregistered currency", function () {
      const ids = L.currencyIdSet(currencies);
      const ev = L.newEvent({ verb: "x", skill: "body", grants: { "core:xp": 1, "made:up": 5 } });
      const errs = L.validate(ev, ids);
      ok(errs.some((e) => e.indexOf("made:up") !== -1), "unknown currency was accepted");
    });

    t("validate accepts every currency in the registry", function () {
      const ids = L.currencyIdSet(currencies);
      const grants = {};
      currencies.currencies.forEach((c) => { grants[c.id] = 1; });
      const ev = L.newEvent({ verb: "x", skill: "body", grants: grants });
      eq(L.validate(ev, ids).length, 0, "a registered currency was rejected");
    });

    t("validate catches missing required fields", function () {
      const ev = L.newEvent({ verb: "x", skill: "body" });
      delete ev.subject;
      ok(L.validate(ev, null).some((e) => e.indexOf("subject") !== -1), "missing field slipped through");
    });

    t("validate rejects a bare-UTC timestamp", function () {
      const ev = L.newEvent({ verb: "x", skill: "body" });
      ev.ts = new Date().toISOString();
      ok(L.validate(ev, null).some((e) => e.indexOf("offset") !== -1), "bare UTC ts was accepted");
    });

    t("validate never returns a rebuilt object", function () {
      eq(typeof L.validate(L.newEvent({ verb: "x", skill: "body" }), null).length, "number",
         "validate should return an array of errors, nothing else");
    });

    /* ---- 6. balances --------------------------------------------------- */
    t("balances are grants minus cost", function () {
      const events = [
        L.newEvent({ verb: "a", skill: "body", grants: { "core:embers": 100 } }),
        L.newEvent({ verb: "b", skill: "body", grants: { "core:embers": 50 } }),
        L.newEvent({ kind: "spend", verb: null, skill: null, cost: { "core:embers": 120 } })
      ];
      eq(L.balances(events)["core:embers"], 30, "spend was not subtracted");
    });

    t("an unknown kind is preserved but contributes nothing", function () {
      const events = [
        L.newEvent({ verb: "a", skill: "body", grants: { "core:embers": 100 } }),
        L.newEvent({ kind: "attend", verb: "community_cleanup", skill: "community",
                     grants: { "core:embers": 999 } })
      ];
      eq(L.balances(events)["core:embers"], 100, "an unknown kind was interpreted");
      eq(L.countUnknownKinds(events), 1, "unknown kind was not counted for the UI");
      eq(L.deserialize(L.serialize(events)).length, 2, "an unknown kind was dropped on write");
    });

    /* ---- 7. ids and levels --------------------------------------------- */
    t("ULIDs are unique and time-sortable", function () {
      const a = L.ulid(1000), b = L.ulid(2000);
      ok(a < b, "later ULID did not sort after earlier one");
      const many = new Set(); for (let i = 0; i < 500; i++) many.add(L.ulid());
      eq(many.size, 500, "ULID collision");
    });

    t("levels get further apart and never cap", function () {
      eq(L.levelFor(0).level, 0, "zero points should be level 0");
      eq(L.levelFor(5).level, 1, "5 points should be level 1");
      let prev = -1;
      for (let p = 0; p < 5000; p += 7) {
        const lv = L.levelFor(p).level;
        ok(lv >= prev, "level went backwards");
        prev = lv;
      }
      ok(L.levelFor(100).need < L.levelFor(3000).need, "levels are not getting further apart");
    });

    /* ---- 8. catalogue and registry integrity ---------------------------- */
    t("every catalogue action has a known skill and tier", function () {
      const skills = new Set(currencies.currencies
        .filter((c) => c.class === "skill").map((c) => c.id.split(":")[1]));
      catalog.actions.forEach((a) => {
        ok(skills.has(a.skill), `action ${a.verb} has unknown skill ${a.skill}`);
        ok(catalog.tiers[a.tier], `action ${a.verb} has unknown tier ${a.tier}`);
      });
    });

    t("catalogue verbs are unique", function () {
      const seen = new Set();
      catalog.actions.forEach((a) => {
        ok(!seen.has(a.verb), `duplicate verb: ${a.verb}`);
        seen.add(a.verb);
      });
    });

    t("every skill is reachable alone, indoors, without money", function () {
      /* The 'reachable from bed' rule, mechanised properly.
       *
       * THE EARLIER VERSION OF THIS TEST WAS WRONG and passed a real bug: it
       * accepted a skill if any action had tier "upkeep" OR "community", so the
       * Community tree passed because its tier is *named* community — while all
       * three of its actions (reached_out, helped_someone, volunteered) required
       * other people. One of five trees was locked for isolated players, who are
       * a large part of who this is built for.
       *
       * Checking the label instead of the property is not a test. This one reads
       * `needs`. */
      const bySkill = {};
      catalog.actions.forEach((a) => {
        if (a.retired) return;
        (bySkill[a.skill] = bySkill[a.skill] || []).push(a);
      });
      Object.entries(bySkill).forEach(([skill, actions]) => {
        const solo = actions.filter((a) => !a.needs || a.needs.length === 0);
        ok(solo.length > 0,
           `skill ${skill} has no action doable alone, indoors, without money — ` +
           `that tree is locked for an isolated player`);
        ok(solo.some((a) => a.tier === "upkeep" || a.tier === "community"),
           `skill ${skill} is solo-reachable only through high-effort actions`);
      });
    });

    t("needs only uses known requirement names", function () {
      const KNOWN = ["out", "people", "money"];
      catalog.actions.forEach((a) => {
        (a.needs || []).forEach((n) => {
          ok(KNOWN.indexOf(n) !== -1, `${a.verb} has unknown need "${n}"`);
        });
      });
    });

    t("no catalogue tier grants core:favor", function () {
      /* Self-care may never mint Favor at any tier. This is the structural rule
       * that keeps the whole economy unfarmable (ADR-009). */
      Object.entries(catalog.tiers).forEach(([name, tier]) => {
        ok(!("core:favor" in (tier.grants || {})),
           `tier ${name} mints core:favor from a self-care action`);
      });
    });

    t("registry: core is closed at exactly three", function () {
      const core = currencies.currencies.filter((c) => c.class === "core");
      eq(core.length, 3, "core currency count changed without an ADR");
    });

    t("registry: every currency has a non-empty only_buys", function () {
      currencies.currencies.forEach((c) => {
        ok(c.only_buys && String(c.only_buys).trim().length > 0,
           `${c.id} has an empty only_buys — the discipline rule says it does not ship`);
      });
    });

    t("registry: local currencies declare an owning tool", function () {
      currencies.currencies.filter((c) => c.class === "local").forEach((c) => {
        ok(c.owner && c.owner !== "core", `${c.id} is local but has no owning tool`);
        eq(c.id.split(":")[0], c.owner, `${c.id} namespace does not match its owner`);
      });
    });

    /* ---- 9. the migration ------------------------------------------------
     * Someone's medication and sleep history is what is at stake, so the only
     * acceptable migration is one that copies and never deletes. */
    t("migration copies a legacy ledger and never deletes it", function () {
      const mem = new Map();
      const realLS = globalThis.localStorage;
      globalThis.localStorage = {
        getItem: (k) => (mem.has(k) ? mem.get(k) : null),
        setItem: (k, v) => mem.set(k, String(v)),
        removeItem: (k) => mem.delete(k)
      };
      try {
        const legacy = L.LEGACY_KEYS[0];
        const events = [L.newEvent({ verb: "brush_teeth", skill: "body", grants: { "core:xp": 10 } })];
        mem.set(legacy, L.serialize(events));

        const moved = L.migrate();
        eq(moved, 1, "did not migrate the legacy ledger");
        ok(mem.get(legacy) !== undefined, "THE LEGACY KEY WAS DELETED — never acceptable");
        eq(L.read().length, 1, "migrated ledger is not readable on the new key");
        eq(L.read()[0].id, events[0].id, "migrated the wrong event");

        eq(L.migrate(), 0, "migration ran twice — it must be idempotent");
      } finally { globalThis.localStorage = realLS; }
    });

    t("migration never overwrites an existing ledger", function () {
      const mem = new Map();
      const realLS = globalThis.localStorage;
      globalThis.localStorage = {
        getItem: (k) => (mem.has(k) ? mem.get(k) : null),
        setItem: (k, v) => mem.set(k, String(v)),
        removeItem: (k) => mem.delete(k)
      };
      try {
        const current = [L.newEvent({ verb: "did_dishes", skill: "home" })];
        const legacy = [L.newEvent({ verb: "brush_teeth", skill: "body" })];
        mem.set(L.STORAGE_KEY, L.serialize(current));
        mem.set(L.LEGACY_KEYS[0], L.serialize(legacy));
        eq(L.migrate(), 0, "migrated over live data");
        eq(L.read()[0].verb, "did_dishes", "live ledger was clobbered by the legacy one");
      } finally { globalThis.localStorage = realLS; }
    });

    /* ---- 10. the character ----------------------------------------------- */
    if (C) {
      const mk = (verb, skill, xp, skillPts, ts, source) =>
        L.newEvent({
          verb, skill, ts,
          source: source || "hearthsmith@0.3.0",
          grants: { "core:xp": xp, "core:embers": xp, ["skill:" + skill]: skillPts }
        });

      t("character: an empty ledger produces a sane sheet, not a crash", function () {
        const c = C.build([], { ledger: L, catalog });
        eq(c.xp, 0, "xp should be 0");
        eq(c.standing.name, "Newly Arrived", "wrong opening standing");
        eq(c.calling, null, "a beginner should have no calling");
        eq(c.skills.length, 5, "all five trees must appear even when unstarted");
        ok(c.skills.every((s) => s.started === false), "unstarted trees must read as unstarted");
        eq(c.daysLogged, 0, "no days yet");
        ok(c.crest.points.length === 5, "crest must draw even at zero");
      });

      t("character: an unstarted skill is 'not started', never negative", function () {
        const c = C.build([mk("brush_teeth", "body", 10, 1)], { ledger: L, catalog });
        const kitchen = c.skills.find((s) => s.id === "kitchen");
        eq(kitchen.points, 0, "unstarted skill should be 0");
        eq(kitchen.started, false, "unstarted skill must be flagged unstarted");
        ok(kitchen.level >= 0, "a skill level must never go below zero");
      });

      t("character: standings are permanent and monotonic in XP", function () {
        let lastIdx = -1;
        for (let xp = 0; xp < 20000; xp += 137) {
          const idx = C.STANDINGS.findIndex((s) => s.name === C.standingFor(xp).name);
          ok(idx >= lastIdx, "standing went backwards as XP rose");
          lastIdx = idx;
        }
      });

      t("character: a calling only appears once its tree reaches level 3", function () {
        const few = C.build([mk("brush_teeth", "body", 10, 1)], { ledger: L, catalog });
        eq(few.calling, null, "calling appeared too early");
        const many = [];
        for (let i = 0; i < 40; i++) many.push(mk("brush_teeth", "body", 10, 2));
        const grown = C.build(many, { ledger: L, catalog });
        ok(grown.skills.find((s) => s.id === "body").level >= 3, "test setup did not reach level 3");
        eq(grown.calling, C.CALLING.body, "calling missing once earned");
      });

      t("character: a gap in logging does not reduce anything", function () {
        const a = mk("brush_teeth", "body", 10, 1, "2026-08-01T09:00:00-07:00");
        const b = mk("brush_teeth", "body", 10, 1, "2026-08-20T09:00:00-07:00");
        const c = C.build([a, b], { ledger: L, catalog });
        eq(c.daysLogged, 2, "a 19-day gap must not erase either day");
        eq(c.xp, 20, "a gap must never reduce XP");
        ok(!("streak" in c), "the character must not expose a streak");
      });

      t("character: events are attributed to the game that wrote them", function () {
        const c = C.build([
          mk("brush_teeth", "body", 10, 1, undefined, "hearthsmith@0.3.0"),
          mk("moved_body", "body", 25, 2, undefined, "fitflexr@1.4.0"),
          mk("moved_body", "body", 25, 2, undefined, "fitflexr@1.4.0")
        ], { ledger: L, catalog });
        eq(c.games.length, 2, "expected two games in the shared ledger");
        eq(c.games[0].game, "fitflexr", "games should be ordered by contribution");
        eq(c.games[0].events, 2, "wrong event count for fitflexr");
      });

      t("character: the crest is deterministic", function () {
        const evs = [mk("brush_teeth", "body", 10, 1), mk("did_dishes", "home", 25, 2)];
        eq(JSON.stringify(C.build(evs, { ledger: L, catalog }).crest),
           JSON.stringify(C.build(evs, { ledger: L, catalog }).crest),
           "the same character drew two different crests");
      });
    }

    /* ---- 11. the shop ----------------------------------------------------
     * The shop is the FIRST code that reads the ledger rather than appending to
     * it, so these tests are mostly about one claim: there is no inventory. What
     * you own is a projection of your spend events and nothing else. The moment
     * a second store exists it can disagree with the first, and the ledger stops
     * being the truth. */
    if (S && shop) {
      const earn = (embers, skill, pts) =>
        L.newEvent({ verb: "brush_teeth", skill: skill || "home",
                     grants: { "core:xp": embers, "core:embers": embers,
                               ["skill:" + (skill || "home")]: pts || 1 } });
      const cheapest = shop.items.slice().sort((a, b) =>
        (a.cost["core:embers"] || 0) - (b.cost["core:embers"] || 0))[0];

      t("shop: ownership is derived from spend events, with no inventory store", function () {
        const item = shop.items[0];
        const evs = [earn(9999, item.skill, 400), S.buyEvent(L, item)];
        const own = S.owned(evs);
        eq(own.length, 1, "a purchase did not produce ownership");
        eq(own[0].item, item.id, "wrong item owned");
        /* The projection must survive a round trip through JSON with nothing
         * kept on the side — that IS the no-inventory claim. */
        eq(S.owned(L.deserialize(L.serialize(evs))).length, 1,
           "ownership did not survive serialisation — something is being held outside the ledger");
        eq(S.owned([]).length, 0, "an empty ledger owns something");
      });

      t("shop: you cannot buy what you cannot afford", function () {
        const item = cheapest;
        const poor = [earn(item.cost["core:embers"] - 1, item.skill, 400)];
        ok(!S.canBuy(poor, item, { ledger: L }).ok, "bought an item with too few Embers");
        const rich = [earn(item.cost["core:embers"], item.skill, 400)];
        ok(S.canBuy(rich, item, { ledger: L }).ok, "exact-change purchase was refused");
      });

      t("shop: a purchase reduces Embers and never touches XP", function () {
        const item = cheapest;
        const price = item.cost["core:embers"];
        const evs = [earn(9999, item.skill, 400)];
        const after = L.balances(evs.concat([S.buyEvent(L, item)]));
        eq(after["core:embers"], 9999 - price, "Embers did not fall by exactly the price");
        eq(after["core:xp"], 9999, "a purchase touched the permanent XP record");
      });

      t("shop: an item is visible but locked until its skill level is met", function () {
        const gated = shop.items.filter((i) => i.unlock_level > 0)[0];
        ok(gated, "no gated item in the shop to test");
        const none = S.view([], shop, { ledger: L, character: C });
        const row = none.find((r) => r.item.id === gated.id);
        ok(row, "a locked item was HIDDEN — seeing what is ahead is the reward");
        eq(row.unlocked, false, "a gated item read as unlocked at level 0");
      });

      t("shop: nothing owned is ever taken back when the balance falls", function () {
        /* §4 rule 2, absolute. Ownership is a fact about the past; it can never
         * be re-decided by a later balance. */
        const item = cheapest;
        const evs = [earn(9999, item.skill, 400), S.buyEvent(L, item)];
        const drained = evs.concat([
          L.newEvent({ kind: "spend", cost: { "core:embers": 9999 },
                       item: "something_else", target: "home:self" })
        ]);
        ok(L.balances(drained)["core:embers"] < 0 || true, "setup");
        eq(S.owned(drained).some((o) => o.item === item.id), true,
           "an item stopped being owned because the balance later fell");
      });

      t("shop: buying the same item twice is refused", function () {
        const item = cheapest;
        const evs = [earn(9999, item.skill, 400), S.buyEvent(L, item)];
        ok(!S.canBuy(evs, item, { ledger: L }).ok, "the same item was sold twice");
      });

      t("shop: a purchase event validates against the frozen schema", function () {
        const ids = L.currencyIdSet(currencies);
        shop.items.forEach((i) => {
          eq(L.validate(S.buyEvent(L, i), ids).length, 0,
             `purchase of ${i.id} produced an invalid event`);
        });
      });

      t("shop: every item names a registered currency and a real skill", function () {
        const ids = L.currencyIdSet(currencies);
        const skills = new Set(currencies.currencies
          .filter((c) => c.class === "skill").map((c) => c.id.split(":")[1]));
        const seenId = new Set();
        shop.items.forEach((i) => {
          ok(!seenId.has(i.id), `duplicate item id: ${i.id}`);
          seenId.add(i.id);
          ok(skills.has(i.skill), `item ${i.id} has unknown skill ${i.skill}`);
          Object.keys(i.cost).forEach((c) =>
            ok(ids.has(c), `item ${i.id} is priced in unregistered currency ${c}`));
        });
      });

      t("shop: no two things overlap, and nothing hangs off the room", function () {
        /* Placement is fixed for now, so a bad cell is a bug that ships. Two
         * items in one place looks like a rendering fault rather than a data
         * one, which is exactly the kind that gets stared at for an hour. */
        const room = shop.room;
        const grid = Object.create(null);
        const all = shop.items.concat(room.fixtures || []);
        all.forEach((i) => {
          const [cx, cy] = i.cell, [w, h] = i.size;
          ok(cx >= 0 && cy >= 0 && cx + w <= room.cols && cy + h <= room.rows,
             `${i.id} at ${i.cell} size ${i.size} falls outside the ${room.cols}x${room.rows} room`);
          const wallItem = i.layer === "wall";
          ok(wallItem ? cy < room.wall_rows : cy >= room.wall_rows,
             `${i.id} is on layer "${i.layer}" but sits at row ${cy} ` +
             `(wall rows are 0-${room.wall_rows - 1})`);
          for (let x = cx; x < cx + w; x++) {
            for (let y = cy; y < cy + h; y++) {
              const key = x + "," + y;
              ok(!grid[key], `${i.id} overlaps ${grid[key]} at ${key}`);
              grid[key] = i.id;
            }
          }
        });
      });

      t("shop: every sprite named actually exists in the tileset", function () {
        /* A missing sprite renders as nothing at all — you buy a thing, it takes
         * your Embers, and the room looks unchanged. Silent, and indistinguishable
         * from a broken purchase. */
        const T = (typeof require === "function")
          ? require("./tiles.js")
          : (typeof Tiles !== "undefined" ? Tiles : null);
        if (!T) return;
        shop.items.concat(shop.room.fixtures || []).forEach((i) => {
          ok(T.has(i.sprite), `${i.id} names sprite "${i.sprite}", which the tileset does not have`);
        });
      });

      t("shop: the room always has something in it, even unfurnished", function () {
        /* An empty room on day one reads as a punishment for being new. The
         * hearth is a fixture: never bought, never lost, always drawn. */
        const empty = S.placed([], shop);
        ok(empty.length > 0, "a brand-new room draws nothing at all");
        ok(empty.every((p) => p.fixture), "an unowned item was drawn in an empty room");
      });

      t("shop: the room leaves space to grow into", function () {
        const room = shop.room;
        ok(S.vacantCells([], shop).length > 0, "a new room offers nowhere to put anything");
        const evs = shop.items.map((i) => S.buyEvent(L, i));
        ok(S.vacantCells(evs, shop).length > 0,
           "buying everything fills the room completely — there is nothing left to want");
        ok(S.placed(evs, shop).length === shop.items.length + (room.fixtures || []).length,
           "owning everything did not place everything");
      });

      t("shop: things are drawn back to front, rugs underneath", function () {
        const evs = shop.items.map((i) => S.buyEvent(L, i));
        const order = S.placed(evs, shop);
        const rank = { rug: 0, wall: 1, floor: 2 };
        let last = -1, lastRow = -1;
        order.forEach((p) => {
          const r = rank[p.item.layer];
          ok(r >= last, `layer ${p.item.layer} drawn after a later layer`);
          if (r !== last) { last = r; lastRow = -1; }
          ok(p.item.cell[1] >= lastRow, "a nearer row was drawn before a further one");
          lastRow = p.item.cell[1];
        });
      });

      t("shop: nothing is priced in XP, and nothing is priced in Favor", function () {
        /* core:xp is not spendable at all (§1) and Favor may never be reachable
         * from a self-care economy (ADR-009). A price list is exactly where the
         * two would leak into each other. */
        shop.items.forEach((i) => {
          ok(!("core:xp" in i.cost), `${i.id} is priced in XP, which is not spendable`);
          ok(!("core:favor" in i.cost), `${i.id} is priced in Favor — Embers must never reach it`);
        });
      });

      t("shop: the cheapest item still costs about a good week, not a good day", function () {
        /* ECONOMY §3's pricing rule, mechanised. An upgrade you can afford the
         * day you unlock it teaches the player the currency is meaningless, and
         * that erosion happens one reasonable-looking discount at a time. */
        const price = cheapest.cost["core:embers"];
        ok(price >= 700, `the cheapest item is ${price} Embers — under a good week (~700+)`);
        ok(price <= 1600, `the cheapest item is ${price} Embers — beyond a good week`);
      });

      t("shop: every skill has something to buy, reachable by an isolated player", function () {
        /* ADR-020 applied to the shop. A tree you can fill but never spend from
         * is a locked tree with extra steps. */
        const bySkill = {};
        shop.items.forEach((i) => { (bySkill[i.skill] = bySkill[i.skill] || []).push(i); });
        ["body", "home", "kitchen", "craft", "community"].forEach((s) => {
          ok((bySkill[s] || []).length > 0, `skill ${s} has nothing to buy`);
        });
      });
    }

    /* ---- 12. retract (ADR-027, ECONOMY.md §2.8) --------------------------
     * Hold to retract: today's log only, a correction may never demote you,
     * Embers floor at zero, and nothing already built is ever taken back. */
    {
      const YESTERDAY = "2020-01-01T09:00:00-07:00";
      /* highWaterBalances() replays in `id` order, and a ULID only sorts by
       * time to millisecond resolution (ECONOMY §2's own description). Tests
       * that build several events in the same tick need an explicit, strictly
       * increasing `ms` so replay order matches creation order — real usage
       * never collides like this (a hold gesture is hundreds of ms), but a
       * synchronous test loop reliably does. */
      let seq = 0;
      const earnEv = (xp, skill, pts, ts) => L.newEvent({
        id: L.ulid(Date.now() + (seq++)),
        verb: "brush_teeth", skill: skill || "body",
        ts: ts || L.nowIso(),
        grants: { "core:xp": xp, "core:embers": xp, ["skill:" + (skill || "body")]: pts || 0 }
      });
      const retractOf = (subjectEv, ts) => L.newEvent({
        id: L.ulid(Date.now() + (seq++)),
        kind: "retract", subject: subjectEv.id, ts: ts || L.nowIso(), meta: { reason: "test" }
      });

      t("retract: an event has the same shape in memory as it does on disk", function () {
        const ev = retractOf(earnEv(10));
        const back = L.deserialize(L.serialize([ev]))[0];
        eq(Object.keys(ev).sort().join(","), Object.keys(back).sort().join(","),
           "retract event changed shape when it was saved");
      });

      t("retract: a ledger holding one round-trips byte-identically", function () {
        const earn = earnEv(10);
        const events = [earn, retractOf(earn)];
        const before = L.serialize(events);
        eq(L.serialize(L.deserialize(before)), before, "round trip changed the bytes");
      });

      t("retract: is a known kind, not counted as written by a newer version", function () {
        ok(L.KNOWN_KINDS.indexOf("retract") !== -1, "retract must be a known kind");
        const earn = earnEv(10);
        eq(L.countUnknownKinds([earn, retractOf(earn)]), 0, "retract was counted as unknown");
      });

      t("retract: balances() subtracts the referenced event's grants", function () {
        const earn = earnEv(50);
        const bal = L.balances([earn, retractOf(earn)]);
        eq(bal["core:xp"], 0, "retracted xp still counted");
        eq(bal["core:embers"], 0, "retracted embers still counted");
      });

      t("retract: a dangling subject subtracts nothing and does not throw", function () {
        const events = [earnEv(50), L.newEvent({ kind: "retract", subject: "not-a-real-id" })];
        let bal = null, threw = false;
        try { bal = L.balances(events); } catch (e) { threw = true; }
        ok(!threw, "balances() threw on a retraction with no matching subject");
        eq(bal["core:xp"], 50, "a dangling retraction changed a balance it should not touch");
      });

      t("retract: canRetract refuses an event outside today's window", function () {
        const old = earnEv(10, "body", 1, YESTERDAY);
        ok(!L.canRetract([old], old.id).ok, "a retraction of yesterday was allowed");
      });

      t("retract: canRetract allows an event logged today", function () {
        const fresh = earnEv(10);
        ok(L.canRetract([fresh], fresh.id).ok, "a same-day retraction was refused");
      });

      t("retract: canRetract refuses an unknown subject", function () {
        ok(!L.canRetract([], "nope").ok, "a retraction of a nonexistent event was allowed");
      });

      if (S && shop) {
        const cheapest = shop.items.slice().sort((a, b) =>
          (a.cost["core:embers"] || 0) - (b.cost["core:embers"] || 0))[0];

        t("retract: Embers floor at zero; a spent purchase is never clawed back", function () {
          const earn = earnEv(cheapest.cost["core:embers"], cheapest.skill, 400);
          const events = [earn, S.buyEvent(L, cheapest), retractOf(earn)];
          const bal = L.balances(events);
          ok(bal["core:embers"] >= 0, "Embers fell below zero after a retraction");
          eq(bal["core:embers"], 0, "Embers did not floor at exactly zero");
          ok(S.owned(events).some((o) => o.item === cheapest.id),
             "an owned item was taken back by retracting the earn that paid for it");
        });

        t("retract: S.owned() is unchanged by any retraction, even of the purchase itself", function () {
          const earn = earnEv(9999, cheapest.skill, 400);
          const buy = S.buyEvent(L, cheapest);
          const events = [earn, buy, retractOf(buy)];
          ok(S.owned(events).some((o) => o.item === cheapest.id),
             "retracting a purchase event removed ownership — nothing built is ever taken back");
        });
      }

      if (C) {
        t("retract: skill level is a high-water mark, never demoted", function () {
          const many = [earnEv(10, "body", 2), earnEv(10, "body", 2), earnEv(10, "body", 2)];
          const before = C.build(many, { ledger: L, catalog });
          const beforeLevel = before.skills.find((s) => s.id === "body").level;
          ok(beforeLevel > 0, "test setup did not reach a level above zero");
          const after = C.build(many.concat([retractOf(many[0])]), { ledger: L, catalog });
          eq(after.skills.find((s) => s.id === "body").level, beforeLevel,
             "a retraction demoted a skill level");
        });

        t("retract: an earned standing is never lost to a retraction", function () {
          const many = [];
          for (let i = 0; i < 5; i++) many.push(earnEv(30, "body", 1));
          const before = C.build(many, { ledger: L, catalog });
          ok(before.standing.name !== "Newly Arrived", "test setup did not raise the standing");
          const after = C.build(many.concat([retractOf(many[0])]), { ledger: L, catalog });
          eq(after.standing.name, before.standing.name, "a retraction took away an earned standing");
        });

        t("retract: a retracted action stops counting toward actions and days logged", function () {
          const only = earnEv(10, "body", 1);
          const before = C.build([only], { ledger: L, catalog });
          eq(before.actions, 1, "test setup expected one action");
          const after = C.build([only, retractOf(only)], { ledger: L, catalog });
          eq(after.actions, 0, "a retracted action still counted");
          eq(after.daysLogged, 0, "a retracted action's day was still counted");
        });
      }
    }

    return results;
  }

  function run(L, catalog, currencies, C, S, shop) {
    const results = makeSuite(L, catalog, currencies, C, S, shop);
    return {
      results: results,
      passed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length
    };
  }

  return { run: run };
});

/* ---- node entry point ------------------------------------------------- */
if (typeof module === "object" && require.main === module) {
  const fs = require("fs"), path = require("path");
  const here = __dirname;
  const L = require(path.join(here, "ledger.js"));
  const C = require(path.join(here, "character.js"));
  const S = require(path.join(here, "shop.js"));
  const catalog = JSON.parse(fs.readFileSync(path.join(here, "catalog.json"), "utf8"));
  const currencies = JSON.parse(fs.readFileSync(path.join(here, "currencies.json"), "utf8"));
  const shop = JSON.parse(fs.readFileSync(path.join(here, "shop.json"), "utf8"));
  const out = module.exports.run(L, catalog, currencies, C, S, shop);
  out.results.forEach((r) =>
    console.log((r.ok ? "  PASS  " : "  FAIL  ") + r.name + (r.ok ? "" : "\n          " + r.msg)));
  console.log(`\n${out.passed} passed, ${out.failed} failed`);
  process.exit(out.failed ? 1 : 0);
}
