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
  const SOURCE = "hearthsmith@0.8.0";

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
   * rather than silently under-reporting someone's totals.
   *
   * "retract" was the first kind added after the schema freeze (ADR-027). It
   * carries no grants of its own — `subject` points at the event it corrects,
   * and its effect is looked up from that event at balance time. */
  const KNOWN_KINDS = ["earn", "spend", "retract"];

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

    /* `verb` and `skill` are attached ONLY when they have a value, for the same
     * reason as the three above — and the shop is what found it necessary.
     *
     * They used to be set unconditionally. On an `earn` event both are always
     * present, so nothing showed for the first two slices. On a `spend` both are
     * undefined, and JSON.stringify drops undefined values: the event carried
     * them in memory and lost them the moment it was saved, so `"verb" in ev`
     * answered differently before and after a round trip. The bytes were stable
     * either way, which is exactly why the byte-stability test never caught it —
     * it only ever ran on earn events, where the two shapes coincide.
     *
     * Nothing stored changes. This removes keys that were never persisted in the
     * first place, so it is not a schema change: it makes the in-memory event
     * equal to the one on disk, which is what preserve-unknown-fields has to be
     * measured against. tests.js pins it. */
    const ev = {
      v: SCHEMA_VERSION,
      id: f.id || ulid(),
      kind: f.kind || "earn",
      ts: ts,
      /* Equal to ts today because there is no backfill UI yet. Still two
       * separate fields — collapsing them destroys the T1 timing signal the
       * moment backfill lands (ADR-011). */
      logged_at: f.logged_at || nowIso(),
      actor: f.actor || "local"
    };
    /* Assigned here rather than in the literal so the key ORDER stays the one
     * ECONOMY §2 documents. Order carries no meaning to any reader, but an
     * export is something a person opens and reads, and a schema that lists its
     * fields in one order should not write them in another. */
    if (f.verb !== undefined) ev.verb = f.verb;
    if (f.skill !== undefined) ev.skill = f.skill;

    return Object.assign(ev, {
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

  function idIndex(events) {
    const byId = Object.create(null);
    for (const e of events || []) { if (e && e.id) byId[e.id] = e; }
    return byId;
  }

  /* What one event contributes to a running total. Shared by balances() (sum
   * in any order — a retraction's effect is fixed once its subject is known)
   * and highWaterBalances() (summed in id order, tracking the peak). A
   * "retract" carries no grants of its own; its effect is the referenced
   * event's grants, subtracted. A subject that is not in the ledger (deleted
   * by nobody — there is no delete — but conceivably from a different device's
   * export) subtracts nothing rather than throwing. */
  function eventDelta(ev, byId, applied) {
    const out = Object.create(null);
    if (!ev || KNOWN_KINDS.indexOf(ev.kind) === -1) return out; // preserve, don't interpret
    if (ev.kind === "retract") {
      /* AT MOST ONCE PER SUBJECT. An event can only be un-done once; a second
       * retraction of the same thing is a duplicate, not a second correction.
       *
       * This is not defensive coding, it is what makes ADR-023 true. That
       * design gets sync for free because two ledgers merge by UNION BY ID —
       * no conflict resolution, nothing to get wrong — and that only holds if
       * every kind is IDEMPOTENT under union. Two devices each correcting the
       * same mis-tap produce two retract events with different ids and the
       * same subject, and the union contains both. Subtracting twice drove
       * `core:xp` NEGATIVE, against the one thing currencies.json promises
       * about it: "Only ever goes up. Never spent, never lost."
       *
       * `applied` is the set of subjects already accounted for in this pass.
       * Callers that replay in a fixed order share one set across the whole
       * replay; a caller without one gets no dedupe, so it is never optional
       * in practice — both callers below pass one. */
      const subject = ev.subject;
      if (!subject) return out;
      if (applied) {
        if (applied[subject]) return out;
        applied[subject] = true;
      }
      const target = byId[subject] || null;
      if (target && target.grants) {
        for (const [cur, amt] of Object.entries(target.grants)) {
          if (typeof amt === "number") out[cur] = (out[cur] || 0) - amt;
        }
      }
      return out;
    }
    if (ev.grants) {
      for (const [cur, amt] of Object.entries(ev.grants)) {
        if (typeof amt === "number") out[cur] = (out[cur] || 0) + amt;
      }
    }
    if (ev.cost) {
      for (const [cur, amt] of Object.entries(ev.cost)) {
        if (typeof amt === "number") out[cur] = (out[cur] || 0) - amt;
      }
    }
    return out;
  }

  function balances(events) {
    const evs = events || [];
    const byId = idIndex(evs);
    const totals = Object.create(null);
    const applied = Object.create(null);
    for (const ev of evs) {
      const d = eventDelta(ev, byId, applied);
      for (const cur of Object.keys(d)) totals[cur] = (totals[cur] || 0) + d[cur];
    }
    /* ECONOMY.md §2.8 / ADR-027: Embers floor at zero. A retraction can only
     * ever reduce a balance that was already spent down toward it; the spend
     * itself (and everything it bought) stands — this is the floor, not a
     * clawback. */
    if ("core:embers" in totals) totals["core:embers"] = Math.max(0, totals["core:embers"]);
    return totals;
  }

  /* The high-water mark of each currency's running balance, replayed in `id`
   * order (ULIDs sort by time). This is what "level and every stat are
   * high-water marks" (ADR-027) reads from: a retraction can lower the LIVE
   * balance (balances(), above) but must never take back a level or a title
   * already reached. In normal operation — no retractions — this equals
   * balances(); the two only diverge once a retraction exists. */
  function highWaterBalances(events) {
    const evs = (events || []).filter(Boolean);
    const byId = idIndex(evs);
    const sorted = evs.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const running = Object.create(null), peak = Object.create(null);
    const applied = Object.create(null);
    for (const ev of sorted) {
      const d = eventDelta(ev, byId, applied);
      for (const cur of Object.keys(d)) {
        running[cur] = (running[cur] || 0) + d[cur];
        peak[cur] = Math.max(peak[cur] || 0, running[cur]);
      }
    }
    return peak;
  }

  function countUnknownKinds(events) {
    return events.filter((e) => e && KNOWN_KINDS.indexOf(e.kind) === -1).length;
  }

  /* Events as a person should see them: a retraction is never shown, and
   * neither is whatever it retracted (ECONOMY §2.8 rule 4 — "never surfaced as
   * a correction"). Anything that counts what someone DID — today's log,
   * days logged, the action tally — should read this instead of the raw
   * ledger. Anything that computes a BALANCE (balances(), highWaterBalances())
   * must keep reading the raw ledger, because that is how a retraction's
   * effect is found in the first place. */
  function visibleEvents(events) {
    const evs = (events || []).filter(Boolean);
    const retracted = Object.create(null);
    for (const e of evs) { if (e.kind === "retract" && e.subject) retracted[e.subject] = true; }
    return evs.filter((e) => e.kind !== "retract" && !retracted[e.id]);
  }

  /* Can `subjectId` be retracted right now? Today's log only (ECONOMY §2.8) —
   * the window IS the safety mechanism, not a default, so this is never
   * configurable. Returns a reason, never just false, matching shop.js's
   * canBuy() convention. */
  function canRetract(events, subjectId, opts) {
    const now = (opts && opts.now) || nowIso();
    const target = (events || []).find((e) => e && e.id === subjectId);
    if (!target) return { ok: false, why: "no such event" };
    /* LOGGED today, not DATED today — ADR-027's own words, and the difference
     * matters more than it looks. Backfill mode (ADR-011) writes ts=yesterday
     * with logged_at=today, and tapping the wrong row while in backfill mode is
     * the single likeliest mis-tap there is. Keying this window on `ts` locked
     * the correction out of exactly the case it exists for.
     *
     * It gives nothing away, either. The window is meant to separate a mis-tap
     * (time-local, caught in seconds) from re-judging your own past
     * (retrospective), and `logged_at` is precisely the field that measures the
     * first. An action both logged and dated yesterday is still closed. */
    const when = target.logged_at || target.ts;
    if (localDayKey(when) !== localDayKey(now)) return { ok: false, why: "not from today" };
    return { ok: true, why: null };
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
    balances, highWaterBalances, visibleEvents, canRetract,
    countUnknownKinds, levelFor, localDayKey, eventsOn
  };
});
