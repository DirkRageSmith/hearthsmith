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

  function makeSuite(L, catalog, currencies, C) {
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

    return results;
  }

  function run(L, catalog, currencies, C) {
    const results = makeSuite(L, catalog, currencies, C);
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
  const catalog = JSON.parse(fs.readFileSync(path.join(here, "catalog.json"), "utf8"));
  const currencies = JSON.parse(fs.readFileSync(path.join(here, "currencies.json"), "utf8"));
  const out = module.exports.run(L, catalog, currencies, C);
  out.results.forEach((r) =>
    console.log((r.ok ? "  PASS  " : "  FAIL  ") + r.name + (r.ok ? "" : "\n          " + r.msg)));
  console.log(`\n${out.passed} passed, ${out.failed} failed`);
  process.exit(out.failed ? 1 : 0);
}
