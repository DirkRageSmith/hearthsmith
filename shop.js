/* Hearthsmith — the shop.
 *
 * THE FIRST CODE IN THIS PROJECT THAT READS THE LEDGER RATHER THAN APPENDING TO
 * IT. Everything before this wrote events and computed totals; this asks the
 * ledger a question it was not explicitly designed to answer — *what do I own?* —
 * and the answer has to come from the same events, with nothing kept on the side.
 *
 * ── THE ONE RULE THIS FILE EXISTS TO HOLD ───────────────────────────────────
 *
 * THERE IS NO INVENTORY. What you own is the set of `spend` events carrying an
 * `item`, projected. Not a table, not a list in localStorage, not a field on a
 * profile. The moment a second store exists it can disagree with the first, and
 * the ledger stops being the truth — which is the same reasoning that keeps
 * balances computed (ledger.js rule 3) and the character derived (ADR-018).
 *
 * The practical payoff is not tidiness. It is that an export (ADR-005) already
 * carries your whole town with no extra work, a merge of two devices (ADR-023)
 * is still a union by id, and a 2031 tool that has never heard of this shop can
 * still show what you built, because a purchase is an ordinary event.
 *
 * ── AND THE ONE IT MUST NEVER BREAK ─────────────────────────────────────────
 *
 * NOTHING BUILT IS EVER TAKEN BACK. §4 rule 2, absolute. Ownership is a fact
 * about the past: it is decided by the purchase having happened, never by the
 * current balance, never by time, never by a later retraction. There is no
 * upkeep, no repossession and no disrepair anywhere in this file, and there is
 * no code path that can remove an item from `owned()`.
 *
 * Skill points gate WHAT is purchasable; Embers pay for it (currencies.json).
 * Stats gate nothing here and never will — ECONOMY §6, "stats are never a gate
 * on Embers or on any purchase."
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Shop = api;
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  /* Where a purchase is directed. One home today; a `target` of "home:self" is
   * what lets a second place, a neighbour's plot or a town square arrive later
   * without touching a single stored event (§2.6). */
  const TARGET = "home:self";

  function ledgerOf(opts) {
    const L = (opts && opts.ledger) || (typeof Ledger !== "undefined" ? Ledger : null);
    if (!L) throw new Error("shop.js needs the ledger module");
    return L;
  }

  /* ---- ownership, projected ------------------------------------------------
   * Deliberately does NOT require the item to exist in shop.json. An item bought
   * in 2027 and retired in 2029 is still owned, and a purchase written by a
   * future tool this build has never heard of still counts. Reading only what we
   * recognise is how you quietly destroy what you cannot comprehend. */
  function owned(events) {
    const out = [];
    const seen = Object.create(null);
    (events || []).forEach(function (e) {
      if (!e || e.kind !== "spend") return;
      if (!e.item) return;
      if (seen[e.item]) return;      // first purchase wins; ids are stable
      seen[e.item] = true;
      out.push({ item: e.item, at: e.ts || null, id: e.id || null, target: e.target || null });
    });
    return out;
  }

  function ownsSet(events) {
    const s = Object.create(null);
    owned(events).forEach(function (o) { s[o.item] = true; });
    return s;
  }

  /* ---- can you buy it -------------------------------------------------------
   * Returns a reason, never just false. A refusal a player cannot read is a bug
   * report they cannot write. */
  function canBuy(events, item, opts) {
    const L = ledgerOf(opts);
    const evs = events || [];
    if (!item) return { ok: false, why: "no such item" };
    if (ownsSet(evs)[item.id]) return { ok: false, why: "already yours" };

    const level = skillLevel(evs, item.skill, opts);
    if (level < (item.unlock_level || 0)) {
      return { ok: false, why: "needs " + item.skill + " level " + item.unlock_level };
    }

    const bal = L.balances(evs);
    const short = [];
    Object.keys(item.cost || {}).forEach(function (cur) {
      const have = bal[cur] || 0;
      if (have < item.cost[cur]) short.push(Math.ceil(item.cost[cur] - have) + " more");
    });
    if (short.length) return { ok: false, why: short.join(", ") };
    return { ok: true, why: null };
  }

  /* The skill-tree level, which is what `unlock_level` means. Uses the character
   * layer when it is present so there is exactly one definition of a level, and
   * falls back to the ledger's own levelFor when shop.js is used standalone. */
  function skillLevel(events, skill, opts) {
    const L = ledgerOf(opts);
    const C = (opts && opts.character) || (typeof Character !== "undefined" ? Character : null);
    if (C) {
      const found = C.build(events || [], { ledger: L }).skills
        .filter(function (s) { return s.id === skill; })[0];
      if (found) return found.level;
    }
    return L.levelFor(L.balances(events || [])["skill:" + skill] || 0).level;
  }

  /* ---- the purchase ---------------------------------------------------------
   * An ordinary event. No new kind, no new table, nothing the schema freeze did
   * not already allow — `kind:"spend"` with `cost`, `item` and `target` has been
   * in ledger.js since slice 0.2 and in ECONOMY §2 since the freeze. */
  function buyEvent(L, item, fields) {
    const f = fields || {};
    return L.newEvent({
      kind: "spend",
      ts: f.ts,
      cost: item.cost,
      item: item.id,
      target: f.target || TARGET,
      meta: f.meta || {}
    });
  }

  /* ---- the shop, as the UI needs it ----------------------------------------
   * Every item, always. A locked item is returned with `unlocked:false`, never
   * omitted — hiding it would turn "here is what is ahead of you" into "here is
   * what you have not earned", and those are different products. */
  function view(events, shop, opts) {
    const L = ledgerOf(opts);
    const evs = events || [];
    const own = ownsSet(evs);
    const bal = L.balances(evs);
    const levels = {};
    return (shop.items || []).map(function (item) {
      if (!(item.skill in levels)) levels[item.skill] = skillLevel(evs, item.skill, opts);
      const level = levels[item.skill];
      const unlocked = level >= (item.unlock_level || 0);
      const price = (item.cost && item.cost["core:embers"]) || 0;
      const have = bal["core:embers"] || 0;
      return {
        item: item,
        owned: !!own[item.id],
        unlocked: unlocked,
        level: level,
        affordable: have >= price,
        shortBy: Math.max(0, Math.ceil(price - have)),
        can: canBuy(evs, item, opts)
      };
    });
  }

  /* What is standing in the room right now, in draw order (the slot order in
   * shop.json), so a caller never has to sort it correctly to look right. */
  function placed(events, shop) {
    const own = ownsSet(events);
    const room = (shop.rooms || [])[0];
    if (!room) return [];
    const bySlot = {};
    (shop.items || []).forEach(function (i) { if (own[i.id]) bySlot[i.slot] = i; });
    return room.slots
      .filter(function (s) { return bySlot[s.id]; })
      .map(function (s) { return { slot: s, item: bySlot[s.id] }; });
  }

  return { TARGET, owned, ownsSet, canBuy, skillLevel, buyEvent, view, placed };
});
