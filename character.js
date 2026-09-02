/* Ragesmith — the character.
 *
 * ONE CHARACTER, ALL GAMES. This computes a player's profile from the shared
 * ledger and nothing else. It is deliberately DOM-free and game-agnostic: any
 * Ragesmith game drops this in, points it at the same ledger, and gets the same
 * character — same levels, same history, same standing.
 *
 * There is no character *record* anywhere. Nothing is stored. The character IS
 * the ledger, viewed a particular way — which is why it can never disagree with
 * the events, never needs migrating, and never has to be kept in sync.
 *
 * ── WHY THIS WORKS WITH NO SERVER ───────────────────────────────────────────
 *
 * Every Ragesmith game ships to the same origin (dirkragesmith.github.io), so
 * they genuinely share one localStorage. Hearthsmith writing an event and a
 * future RPG reading it is not a feature that needs building — it is already
 * true. That is the whole "many games, one world" thesis, and it costs nothing.
 *
 * ── THE RULES THIS FILE MUST NOT BREAK ──────────────────────────────────────
 *
 * A character sheet is exactly where shame creeps into a self-care product, so:
 * no streaks, no decay, no "you used to be", no comparison to anyone, and an
 * untouched skill reads as NOT STARTED rather than neglected. Titles are earned
 * and never lost. See ECONOMY.md §4 and ADR-006.
 *
 * NOTE ON LOCATION: this lives in hearthsmith/ because that is the only game
 * that exists. When game #2 ships, extract it — do not copy it. Two divergent
 * copies of the character layer would be the end of one character across games.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Character = api;
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  const SKILLS = ["body", "home", "kitchen", "craft", "community"];

  const SKILL_LABEL = {
    body: "Body", home: "Home", kitchen: "Kitchen",
    craft: "Craft", community: "Community"
  };

  /* Standings are cumulative and PERMANENT. Once earned, never lost — a title
   * that can be taken away is a punishment mechanic wearing a reward's clothes. */
  const STANDINGS = [
    { at: 0,     name: "Newly Arrived" },
    { at: 100,   name: "Ember-Tender" },
    { at: 500,   name: "Hearthkeeper" },
    { at: 1500,  name: "Warden of the Long Fire" },
    { at: 4000,  name: "Smith of the Quiet Hours" },
    { at: 10000, name: "Keeper of the Deep Coals" }
  ];

  /* Shown only once a tree reaches level 3, so it reads as something earned
   * rather than a label applied to a beginner. Absent, never "none". */
  const CALLING = {
    body: "the Steady", home: "the Tender", kitchen: "the Provider",
    craft: "the Maker", community: "the Kind"
  };

  function standingFor(xp) {
    let current = STANDINGS[0], next = null;
    for (let i = 0; i < STANDINGS.length; i++) {
      if (xp >= STANDINGS[i].at) { current = STANDINGS[i]; next = STANDINGS[i + 1] || null; }
    }
    return {
      name: current.name,
      next: next ? next.name : null,
      toNext: next ? next.at - xp : null
    };
  }

  /* A source is "hearthsmith@0.3.0"; the game is the part before the @. This is
   * what makes the shared world visible on the sheet — you can see which games
   * have contributed to who you are. */
  function gameOf(source) {
    return String(source || "unknown").split("@")[0];
  }

  function build(events, opts) {
    const L = (opts && opts.ledger) || (typeof Ledger !== "undefined" ? Ledger : null);
    if (!L) throw new Error("character.js needs the ledger module");
    const catalog = (opts && opts.catalog) || null;
    const evs = events || [];

    const totals = L.balances(evs);
    const xp = Math.round(totals["core:xp"] || 0);
    const embers = Math.round(totals["core:embers"] || 0);
    const visible = L.visibleEvents ? L.visibleEvents(evs) : evs;

    /* ADR-027: level and every stat are high-water marks — a retraction may
     * lower the live xp/points above (that IS the correction, and it is what
     * `xp` reports), but it must never take back a level, a skill tier, or a
     * standing already reached. Everything that reads as a LEVEL below reads
     * the peak, never the live total. */
    const hw = L.highWaterBalances ? L.highWaterBalances(evs) : totals;

    /* ---- skills ---- */
    const skills = SKILLS.map(function (id) {
      const points = hw["skill:" + id] || 0;
      const lv = L.levelFor(points);
      return {
        id: id,
        label: SKILL_LABEL[id],
        points: points,
        level: lv.level,
        into: lv.into,
        need: lv.need,
        progress: lv.need ? lv.into / lv.need : 0,
        started: points > 0   // NOT "neglected". An untouched tree is simply unstarted.
      };
    });

    const top = skills.slice().sort(function (a, b) {
      return b.points - a.points || SKILLS.indexOf(a.id) - SKILLS.indexOf(b.id);
    })[0];

    /* ---- days. Counted, never streaked. ----
     * Reads `visible`: a retracted action never happened, so it must not seed
     * a day, a game's first/last, or the most-logged tally (ECONOMY §2.8 rule
     * 4 — never surfaced as a correction, which cuts both ways: it must not
     * read as a tally of mistakes, and it must not linger as a phantom day). */
    const dayset = {};
    let first = null, last = null;
    visible.forEach(function (e) {
      if (!e || !e.ts) return;
      const d = L.localDayKey(e.ts);
      dayset[d] = (dayset[d] || 0) + 1;
      if (!first || d < first) first = d;
      if (!last || d > last) last = d;
    });
    const days = Object.keys(dayset).sort();
    const month = last ? last.slice(0, 7) : null;
    const daysThisMonth = days.filter(function (d) { return month && d.slice(0, 7) === month; }).length;

    /* ---- which games wrote to this character ---- */
    const byGame = {};
    visible.forEach(function (e) {
      if (!e) return;
      const g = gameOf(e.source);
      const rec = byGame[g] || (byGame[g] = { game: g, events: 0, first: null, last: null });
      rec.events++;
      const d = e.ts ? L.localDayKey(e.ts) : null;
      if (d) {
        if (!rec.first || d < rec.first) rec.first = d;
        if (!rec.last || d > rec.last) rec.last = d;
      }
    });
    const games = Object.keys(byGame).map(function (k) { return byGame[k]; })
      .sort(function (a, b) { return b.events - a.events; });

    /* ---- most-logged action, purely as a mirror ---- */
    const verbCount = {};
    visible.forEach(function (e) { if (e && e.verb) verbCount[e.verb] = (verbCount[e.verb] || 0) + 1; });
    const labelOf = {};
    if (catalog) catalog.actions.forEach(function (a) { labelOf[a.verb] = a.label; });
    const mostLogged = Object.keys(verbCount)
      .sort(function (a, b) { return verbCount[b] - verbCount[a]; })
      .slice(0, 3)
      .map(function (v) { return { verb: v, label: labelOf[v] || v, count: verbCount[v] }; });

    const standing = standingFor(hw["core:xp"] || 0);
    const calling = top && top.level >= 3 ? CALLING[top.id] : null;

    return {
      name: (opts && opts.name) || null,
      standing: standing,
      calling: calling,
      title: calling ? standing.name + ", " + calling : standing.name,
      xp: xp,
      embers: embers,
      skills: skills,
      topSkill: top && top.points > 0 ? top : null,
      actions: visible.filter(function (e) { return e && e.kind === "earn"; }).length,
      daysLogged: days.length,
      daysThisMonth: daysThisMonth,
      firstDay: first,
      lastDay: last,
      games: games,
      mostLogged: mostLogged,
      unknownKinds: L.countUnknownKinds(evs),
      crest: crest(skills, top)
    };
  }

  /* ---- the crest ---------------------------------------------------------
   * A five-armed sigil, one arm per skill, each arm's length driven by that
   * skill's level. It is deterministic — the same character always draws the
   * same crest — and it visibly grows as you do, which is the entire point of
   * having one instead of picking an avatar from a list.
   *
   * Zero art dependency, which is why the character sheet did not have to wait
   * on the licence question. */
  function crest(skills, top) {
    const HUE = { body: 96, home: 210, kitchen: 28, craft: 276, community: 336 };
    const arms = skills.map(function (s, i) {
      const angle = -90 + i * 72;
      const reach = 0.34 + Math.min(0.62, Math.log10(1 + s.points / 6) * 0.42);
      return {
        skill: s.id,
        angle: angle,
        reach: reach,
        hue: HUE[s.id],
        lit: s.started
      };
    });
    return {
      arms: arms,
      hue: top && top.points > 0 ? HUE[top.id] : 30,
      points: arms.map(function (a) {
        const rad = a.angle * Math.PI / 180;
        return {
          x: +(50 + Math.cos(rad) * a.reach * 46).toFixed(2),
          y: +(50 + Math.sin(rad) * a.reach * 46).toFixed(2),
          skill: a.skill, hue: a.hue, lit: a.lit
        };
      })
    };
  }

  return { SKILLS, SKILL_LABEL, STANDINGS, CALLING, standingFor, gameOf, build, crest };
});
