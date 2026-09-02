/* Hearthsmith — the stat layer. STR / VIT / SPD / AGI / DEF / LUK.
 *
 * ECONOMY.md §6 / ADR-024, frozen 2026-09-01. A pure function of the ledger:
 * no roll, no seed, nothing stored, recomputes identically every time
 * (constraint 5) — same shape as character.js's own skill points.
 *
 * Lives apart from character.js on purpose. character.js's own header says
 * "when game #2 ships, extract it" — a sibling module here means the stat
 * layer does not have to wait on that extraction to exist, and it stays a
 * small structural call rather than a design one (NEXT.md, slice 1.5).
 *
 * NO UI READS THIS YET. ECONOMY §6 says outright: "what stats do in
 * Hearthsmith today: nothing, and that is correct." They accrue silently
 * from the first event, exactly as Embers did through all of Tier 0.
 *
 * NO STAT MAY EVER MULTIPLY `grants`. There is no code path here that reads a
 * stat back into an award calculation, and there must never be one.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Stats = api;
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  const STATS = ["str", "vit", "spd", "agi", "def", "luk"];
  const DERIVED_PER_LEVEL = 4;
  const MILESTONE_ALL = 1; // +1 to each of the six, on a milestone level

  /* Which stat an event feeds, and how much. Reads the resolved `stat:*`
   * weight carried on the event's `grants` (ECONOMY §6: "the affinity lives
   * on the event, resolved at log time") — never re-derives it from
   * catalog.json at read time, so a future retune of the verb->stat table
   * cannot rewrite what an old event already meant (ADR-012's precedent). */
  function statOf(ev) {
    if (!ev || !ev.grants) return null;
    for (const k of Object.keys(ev.grants)) {
      if (k.indexOf("stat:") === 0) return k.slice(5);
    }
    return null;
  }

  /* Split `total` whole points across STATS proportional to `weights`,
   * largest-remainder — naive rounding cannot be trusted to sum to exactly
   * `total` and ECONOMY §6 is explicit that it must. Ties broken by STATS
   * order, so the same ledger always produces the same split (constraint 5;
   * Array#sort is a stable sort in every engine this runs on). */
  function largestRemainder(weights, total) {
    const sum = STATS.reduce((s, k) => s + (weights[k] || 0), 0);
    const out = {};
    STATS.forEach((k) => (out[k] = 0));
    if (sum <= 0) return out;
    const shares = STATS.map((k) => (total * (weights[k] || 0)) / sum);
    let assigned = 0;
    STATS.forEach((k, i) => { out[k] = Math.floor(shares[i]); assigned += out[k]; });
    const byRemainder = STATS.map((k, i) => ({ k, rem: shares[i] - Math.floor(shares[i]) }))
      .sort((a, b) => b.rem - a.rem);
    let left = total - assigned;
    for (let i = 0; left > 0 && i < byRemainder.length; i++, left--) out[byRemainder[i].k] += 1;
    return out;
  }

  /* Milestone count reached BY level L. floor((L-1)/5) — ADR-024's own worked
   * example (5 milestones at level 30, 19 at level 100) only matches this
   * reading, not the ambiguous floor(L/5) the ECONOMY prose reads as
   * (NEXT.md, slice 1.5, "two things pre-resolved"). */
  function milestonesThrough(level) {
    return Math.floor((level - 1) / 5);
  }

  /* The stat sheet: a pure function of the ledger. Replays EARN events in
   * `id` order (ULIDs sort by time — same ordering highWaterBalances() uses)
   * and, on every character level crossed, tallies that level's affinity and
   * splits 4 points by largest remainder, then adds +1 to all six on a
   * milestone level. Reads visibleEvents() so a retracted action neither
   * contributes xp nor moves a stat — points can only ever accumulate,
   * because this is always recomputed from the full ledger, never adjusted
   * incrementally. */
  function build(events, opts) {
    const L = (opts && opts.ledger) || (typeof Ledger !== "undefined" ? Ledger : null);
    if (!L) throw new Error("stats.js needs the ledger module");
    const visible = (L.visibleEvents ? L.visibleEvents(events || []) : (events || []))
      .filter((e) => e && e.kind === "earn");
    const sorted = visible.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    const totals = {}; STATS.forEach((k) => (totals[k] = 0));
    let xp = 0, level = 1;
    let windowAffinity = {}; STATS.forEach((k) => (windowAffinity[k] = 0));

    for (const ev of sorted) {
      const dxp = (ev.grants && ev.grants["core:xp"]) || 0;
      const stat = statOf(ev);
      if (stat && STATS.indexOf(stat) !== -1) {
        windowAffinity[stat] += ev.grants["stat:" + stat];
      }
      xp += dxp;
      const newLevel = L.characterLevelFor(xp).level;
      while (level < newLevel) {
        const split = largestRemainder(windowAffinity, DERIVED_PER_LEVEL);
        STATS.forEach((k) => (totals[k] += split[k]));
        windowAffinity = {}; STATS.forEach((k) => (windowAffinity[k] = 0));
        const prevLevel = level;
        level++;
        if (milestonesThrough(level) > milestonesThrough(prevLevel)) {
          STATS.forEach((k) => (totals[k] += MILESTONE_ALL));
        }
      }
    }

    return {
      level: level,
      xp: xp,
      points: totals,
      totalPoints: STATS.reduce((s, k) => s + totals[k], 0)
    };
  }

  return { STATS, statOf, largestRemainder, milestonesThrough, build };
});
