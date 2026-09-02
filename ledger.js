/* Hearthsmith — the ledger.
 *
 * The append-only event store every Ragesmith tool will read from. No DOM in
 * this file; it runs unchanged in a browser and in node, which is how the same
 * tests cover both.
 *
 * The contract this implements is frozen in ../ECONOMY.md §2 and §2.6. The three
 * rules worth stating here because breaking them is silent:
 *
 *   1. APPEND ONLY. Nothing is ever edited or deleted. Corrections are new
 *      events carrying meta.corrects.
 *   2. UNKNOWN FIELDS ARE PRESERVED. Events are never rebuilt field-by-field on
 *      read or write, so a field written by a 2031 tool survives a 2026 tool
 *      touching the file. This is why validate() only *inspects*.
 *   3. BALANCES ARE COMPUTED, NEVER STORED. sum(grants) - sum(cost), every time.
 *      A stored balance is a second source of truth waiting to disagree.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Ledger = api;
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  const SCHEMA_VERSION = 1;
  const SOURCE = "hearthsmith@0.4.0";

  /* THE LEDGER BELONGS TO THE PLAYER, NOT TO ONE GAME.
   *
   * It was `hearthsmith.ledger.v1` until 2026-08-31, which made Hearthsmith
   * special in a world where the whole thesis is that every game writes to one
   * shared ledger — game #4 reading a key named after game #1 would be absurd.
   *
   * Every Ragesmith game ships to the same origin (dirkragesmith.github.io), so
   * localStorage is genuinely shared between them already. That is what makes
   * one character across all games work with no server at all.
   *
   * Migration is NON-DESTRUCTIVE: the old key is copied, never deleted. If this
   * goes wrong, someone's medication and sleep history is what is lost, so the
   * old copy stays on disk as a backup forever. It costs a few KB. */
  const STORAGE_KEY = "ragesmith.ledger.v1";
  const LEGACY_KEYS = ["hearthsmith.ledger.v1"];

  /* Kinds this version understands. An event with any other kind is PRESERVED
   * but contributes nothing to balances — the forward-compatibility rule from
   * ECONOMY.md §2. countUnknownKinds() exists so the UI can say so out loud
   * rather than silently under-reporting someone's totals. */
  const KNOWN_KINDS = ["earn", "spend"];

  const REQUIRED_FIELDS = [
    "v", "id", "kind", "ts", "logged_at", "actor",
    "source", "subject", "place", "origin"
  ];

  /* ---------- time ----------------------------------------------------- */

  const pad = (n, w = 2) => String(Math.abs(n)).padStart(w, "0");

  /* ISO 8601 WITH THE LOCAL OFFSET. Deliberately not toISOString(), which
   * returns UTC and throws the offset away — "did you do this before bed?" is
   * unanswerable without it, and trust tier T1 is built on exactly that. */
  function nowIso(date) {
    const d = date || new Date();
    const off = -d.getTimezoneOffset();
    const sign = off >= 0 ? "+" : "-";
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
      `${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`
    );
  }

  /* Note there is deliberately no `|Z` alternative. A bare-UTC timestamp is the
   * exact failure this guards against: `new Date().toISOString()` looks correct,
   * validates as ISO 8601 everywhere else, and silently discards the offset that
   * trust tier T1 is built on. It must be rejected, not tolerated. */
  const HAS_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?[+-]\d{2}:\d{2}$/;

  /* ---------- ULID ------------------------------------------------------ */

  const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford, no I/L/O/U

  function randomBytes(n) {
    const out = new Uint8Array(n);
    const c = typeof crypto !== "undefined" ? crypto : null;
    if (c && c.getRandomValues) return c.getRandomValues(out);
    // node without webcrypto
    const nodeCrypto = require("crypto");
    return Uint8Array.from(nodeCrypto.randomBytes(n));
  }

  /* Sortable by time, generated offline, unique without a server — which makes
   * eventual multi-device sync a merge instead of a negotiation. */
  function ulid(now) {
    let t = typeof now === "number" ? now : Date.now();
    let time = "";
    for (let i = 0; i < 10; i++) {
      time = B32[t % 32] + time;
      t = Math.floor(t / 32);
    }
    const bytes = randomBytes(16);
    let rand = "";
    for (let i = 0; i < 16; i++) rand += B32[bytes[i] % 32];
    return time + rand;
  }

  /* ---------- construction --------------------------------------------- */

  function newEvent(fields) {
    const f = fields || {};
    const ts = f.ts || nowIso();
    /* Spend-shaped fields are only attached when present, so an ordinary earn
     * event never carries an empty `cost: {}` that a future reader might treat
     * as meaningful. */
    const extra = {};
    if (f.cost) extra.cost = f.cost;
    if (f.item !== undefined) extra.item = f.item;
    if (f.target !== undefined) extra.target = f.target;
    return Object.assign({
      v: SCHEMA_VERSION,
      id: f.id || ulid(),
      kind: f.kind || "earn",
      ts: ts,
      /* Equal to ts today because there is no backfill UI yet. Still two
       * separate fields — collapsing them destroys the T1 timing signal the
       * moment backfill lands (ADR-011). */
      logged_at: f.logged_at || nowIso(),
      actor: f.actor || "local",
      verb: f.verb,
      skill: f.skill,
      trust: f.trust || "T0",
      source: f.source || SOURCE,
      subject: f.subject === undefined ? null : f.subject,
      place: f.place === undefined ? null : f.place,
      origin: f.origin === undefined ? null : f.origin,
      grants: f.grants || {},
      meta: f.meta || {}
    }, extra);
  }

  /* ---------- validation ------------------------------------------------
   * Only ever INSPECTS. Never returns a rebuilt object, because rebuilding is
   * how unknown fields get silently dropped. */

  function validate(ev, currencyIds) {
    const errs = [];
    if (ev === null || typeof ev !== "object" || Array.isArray(ev)) {
      return ["event must be an object"];
    }
    for (const k of REQUIRED_FIELDS) {
      if (!(k in ev)) errs.push(`missing required field: ${k}`);
    }
    if ("v" in ev && ev.v !== SCHEMA_VERSION) {
      errs.push(`unsupported schema version: ${ev.v}`);
    }
    for (const field of ["ts", "logged_at"]) {
      if (field in ev && !HAS_OFFSET.test(String(ev[field]))) {
        errs.push(`${field} must be ISO 8601 with an explicit UTC offset`);
      }
    }
    for (const map of ["grants", "cost"]) {
      if (!(map in ev) || ev[map] == null) continue;
      const m = ev[map];
      if (typeof m !== "object" || Array.isArray(m)) {
        errs.push(`${map} must be an object`);
        continue;
      }
      for (const [cur, amt] of Object.entries(m)) {
        if (typeof amt !== "number" || !isFinite(amt)) {
          errs.push(`${map}["${cur}"] must be a finite number`);
        }
        /* An unregistered currency is a HARD ERROR, never a warning. This one
         * check is the entire defence against currency soup arriving by
         * accident — see ECONOMY.md §0. */
        if (currencyIds && !currencyIds.has(cur)) {
          errs.push(`unknown currency id: ${cur} (not in currencies.json)`);
        }
      }
    }
    return errs;
  }

  function currencyIdSet(registry) {
    if (!registry || !Array.isArray(registry.currencies)) return null;
    return new Set(registry.currencies.map((c) => c.id));
  }

  /* ---------- serialisation --------------------------------------------
   * Byte-stable so the no-op round-trip test means something. */

  function serialize(events) {
    return JSON.stringify(events, null, 2) + "\n";
  }

  function deserialize(text) {
    if (!text) return [];
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("ledger must be a JSON array");
    return parsed;
  }

  /* ---------- storage --------------------------------------------------- */

  function store() {
    return typeof localStorage !== "undefined" ? localStorage : null;
  }

  /* Copy a legacy ledger forward the first time we see one. Idempotent, and it
   * never deletes the source. Returns the number of events migrated. */
  function migrate() {
    const s = store();
    if (!s) return 0;
    if (s.getItem(STORAGE_KEY) !== null) return 0; // already on the new key
    for (const key of LEGACY_KEYS) {
      const raw = s.getItem(key);
      if (raw === null) continue;
      let events;
      try { events = deserialize(raw); }
      catch (e) {
        console.error("ragesmith: legacy ledger at " + key + " is unreadable; leaving it alone", e);
        continue;
      }
      s.setItem(STORAGE_KEY, serialize(events));
      console.info(
        "ragesmith: migrated " + events.length + " events from " + key +
        " to " + STORAGE_KEY + ". The old key is kept as a backup and is never deleted."
      );
      return events.length;
    }
    return 0;
  }

  function read() {
    const s = store();
    if (!s) return [];
    try {
      migrate();
      return deserialize(s.getItem(STORAGE_KEY));
    } catch (e) {
      /* Never destroy a ledger we failed to parse. Someone's medication
       * history is not something to recover from by wiping. */
      console.error("ragesmith: ledger unreadable, refusing to overwrite", e);
      throw e;
    }
  }

  function write(events) {
    const s = store();
    if (!s) throw new Error("no localStorage available");
    s.setItem(STORAGE_KEY, serialize(events));
    return events;
  }

  function append(events, ev) {
    return events.concat([ev]); // never mutates the input array
  }

  function appendAndSave(ev, currencyIds) {
    const errs = validate(ev, currencyIds);
    if (errs.length) throw new Error("invalid event: " + errs.join("; "));
    const next = append(read(), ev);
    write(next);
    return next;
  }

  /* ---------- derived state --------------------------------------------
   * Every number below is computed on read. Nothing here is ever persisted. */

  function balances(events) {
    const totals = Object.create(null);
    for (const ev of events) {
      if (!ev || KNOWN_KINDS.indexOf(ev.kind) === -1) continue; // preserve, don't interpret
      if (ev.grants) {
        for (const [cur, amt] of Object.entries(ev.grants)) {
          if (typeof amt === "number") totals[cur] = (totals[cur] || 0) + amt;
        }
      }
      if (ev.cost) {
        for (const [cur, amt] of Object.entries(ev.cost)) {
          if (typeof amt === "number") totals[cur] = (totals[cur] || 0) - amt;
        }
      }
    }
    return totals;
  }

  function countUnknownKinds(events) {
    return events.filter((e) => e && KNOWN_KINDS.indexOf(e.kind) === -1).length;
  }

  /* Levels get further apart and never cap. Cumulative cost of level L is
   * 5*L*(L+1)/2, computed iteratively because an obviously-correct loop beats a
   * clever closed form nobody can check. */
  function levelFor(points) {
    let level = 0, spent = 0, next = 5;
    while (points >= spent + next) { spent += next; level++; next = 5 * (level + 1); }
    return { level: level, into: points - spent, need: next };
  }

  function localDayKey(iso) {
    return String(iso).slice(0, 10); // already local-with-offset, so this is the local day
  }

  function eventsOn(events, dayKey) {
    return events.filter((e) => e && e.ts && localDayKey(e.ts) === dayKey);
  }

  return {
    SCHEMA_VERSION, SOURCE, STORAGE_KEY, LEGACY_KEYS, KNOWN_KINDS, REQUIRED_FIELDS,
    nowIso, ulid, newEvent, validate, currencyIdSet,
    serialize, deserialize, read, write, append, appendAndSave, migrate,
    balances, countUnknownKinds, levelFor, localDayKey, eventsOn
  };
});
