/* Hearthsmith — the tileset.
 *
 * THIS FILE IS THE ART SEAM. Everything else in the game asks it for a sprite by
 * name and does not care where the pixels come from. Swapping to a bought
 * tileset (Kenney CC0, LimeZu Modern Interiors, anything) means replacing this
 * one module with one that returns `<image>` slices of a spritesheet under the
 * same names — the renderer, the shop and the ledger do not change.
 *
 * That seam is the whole point. Art is the part of this project most likely to
 * be replaced, and the part with a licence question attached, so it is the part
 * that gets kept behind an interface.
 *
 * ── HOW SPRITES ARE WRITTEN ─────────────────────────────────────────────────
 *
 * Each sprite is a 16×16 grid of characters, one character per pixel, indexed
 * into PALETTE. `.` is transparent. It is genuine pixel art, it is diffable in
 * git, and it needs no binary in the repo and no download to build against.
 *
 * Sprites are emitted as SVG rects with runs of identical pixels merged, so a
 * 16×16 sprite is usually 30-60 rects rather than 256. They scale crisply to any
 * size, which matters because the same sprite is drawn at 20px in the shop list
 * and at 3× that in the room.
 *
 * ── THE PALETTE IS FIXED, AND DOES NOT FOLLOW THE UI THEME ──────────────────
 *
 * The interface is theme-aware; the room is not. A room is a place, and a place
 * does not change colour because the phone went into dark mode. The warmth in
 * here comes from the hearth light the renderer lays over the top, which is
 * driven by the ledger — not from a CSS variable.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Tiles = api;
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  const SIZE = 16;

  const PALETTE = {
    a: "#2b211c", // outline / deep shadow
    b: "#4a3728", // wood dark
    c: "#6b4f36", // wood
    d: "#8a6a48", // wood light
    e: "#b08d64", // wood pale
    f: "#ece3d6", // cream / linen
    g: "#c9b39a", // plaster shadow
    h: "#7d8590", // metal
    i: "#565f66", // metal dark
    j: "#b5674f", // cloth, warm
    k: "#8f4a37", // cloth, warm dark
    l: "#6f8a72", // cloth, cool
    m: "#4d6551", // cloth, cool dark
    n: "#5f8f52", // leaf
    o: "#e0b25c", // brass
    p: "#ff9d4d", // ember
    q: "#ffd9a0", // glow
    r: "#a8cbd8", // glass
    s: "#6d93a3", // glass, deep
    t: "#3b2f2a", // near black
    u: "#9aa3ab", // steel, light
    v: "#7a5a3f", // wainscot
    w: "#d8c3a5", // wall
    x: "#5d4530", // baseboard
    y: "#7a5636", // floor plank
    z: "#8a6440"  // floor plank, light
  };

  /* ---- the room shell -------------------------------------------------- */

  const TILES = {
    /* Wall: warm plaster with a faint vertical grain. Deliberately low contrast;
     * everything hung on it has to read against it. */
    wall: [
      "wwwwwwwwwwwwwwww",
      "wwwwwwgwwwwwwwww",
      "wwwwwwgwwwwwwwww",
      "wwwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwwww",
      "wwwwwwwwwwwgwwww",
      "wwwwwwwwwwwgwwww",
      "wwwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwwww",
      "wwgwwwwwwwwwwwww",
      "wwgwwwwwwwwwwwww",
      "wwwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwgww",
      "wwwwwwwwwwwwwgww"
    ],
    /* Wainscot: the panelled lower band of the wall — rail on top, skirting
     * below. One tile IS one panel, so panels line up with the floor boards. */
    wainscot: [
      "eeeeeeeeeeeeeeee",
      "dddddddddddddddd",
      "cccccccccccccccc",
      "cbbbbbbbbbbbbbbc",
      "cbvvvvvvvvvvvvbc",
      "cbvvvvvvvvvvvvbc",
      "cbvvvvvvvvvvvvbc",
      "cbvvvvvvvvvvvvbc",
      "cbvvvvvvvvvvvvbc",
      "cbvvvvvvvvvvvvbc",
      "cbvvvvvvvvvvvvbc",
      "cbvvvvvvvvvvvvbc",
      "cbbbbbbbbbbbbbbc",
      "cccccccccccccccc",
      "xxxxxxxxxxxxxxxx",
      "aaaaaaaaaaaaaaaa"
    ],
    /* Floor: ONE BOARD PER TILE, and as few seams as will still read.
     *
     * Two drafts got this wrong in opposite directions. The first packed three
     * planks into every sixteen pixels, so the seams were denser than anything
     * standing on them and the floor read as BRICKWORK. The second gave every
     * tile its own vertical end-joint, which put a join every sixteen pixels in
     * both directions and turned it into a grid of PANELS.
     *
     * A board is a whole tile tall with one soft seam under it, and only the
     * `b` variant carries an end-joint — so in the 2x2 pattern the joints land
     * every thirty-two pixels, staggered, the way boards are actually laid. */
    floor_a: [
      "zzzzzzzzzzzzzzzz",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "yyyyyyyyyyyyyyyy",
      "bbbbbbbbbbbbbbbb"
    ],
    floor_b: [
      "zzzzzzzzbzzzzzzz",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "yyyyyyyybyyyyyyy",
      "bbbbbbbbbbbbbbbb"
    ]
  };

  /* ---- furniture and fittings ------------------------------------------ */

  const SPRITES = {
    /* --- the hearth. Always present, never bought: the room is never empty,
     * because an empty room on day one reads as a punishment for being new. --- */
    hearth: [
      "................",
      "..aaaaaaaaaaaa..",
      "..avvvvvvvvvva..",
      "..avaaaaaaaava..",
      "..avattttttava..",
      "..avattttttava..",
      "..avattqqttava..",
      "..avatqppqtava..",
      "..avaqppppqava..",
      "..avaqppppqava..",
      "..avvqqppqqvva..",
      "..avvvqqqqvvva..",
      "..avvvvvvvvvva..",
      "..aaaaaaaaaaaa..",
      "..aaaaaaaaaaaa..",
      "................"
    ],

    /* --- kitchen --- */
    stove: [
      "................",
      ".uuuuuuuuuuuuuu.",
      ".uiiiiiiiiiiiiu.",
      ".uihhhhhhhhhhiu.",
      ".uihaahhhhaahiu.",
      ".uihaahhhhaahiu.",
      ".uihhhhhhhhhhiu.",
      ".uiiiiiiiiiiiiu.",
      ".uhaaaaaaaaaahu.",
      ".uhattttttttahu.",
      ".uhatqppppqtahu.",
      ".uhatqppppqtahu.",
      ".uhattttttttahu.",
      ".uhaaaaaaaaaahu.",
      ".uiiiiiiiiiiiiu.",
      "..aa........aa.."
    ],
    sink: [
      "................",
      "......hh........",
      ".....hiih.......",
      ".....h..h.......",
      ".....h..h.......",
      ".uuuuuuuuuuuuuu.",
      ".uiiiiiiiiiiiiu.",
      ".uihhhhhhhhhhiu.",
      ".uihrrrrrrrrhiu.",
      ".uihrsssssrrhiu.",
      ".uihrrrrrrrrhiu.",
      ".uihhhhhhhhhhiu.",
      ".ucccccccccccdu.",
      ".ucbbccccbbccdu.",
      ".ucccccccccccdu.",
      "..aa........aa.."
    ],
    counter: [
      "................",
      "................",
      "..eeeeeeeeeeee..",
      "..dddddddddddd..",
      "..cccccccccccc..",
      "..cbbbbccbbbbc..",
      "..cbaaabcbaaabc.",
      "..cbaaabcbaaabc.",
      "..cbbbbccbbbbc..",
      "..cccccccccccc..",
      "..cbbbbccbbbbc..",
      "..cbaaabcbaaabc.",
      "..cbbbbccbbbbc..",
      "..cccccccccccc..",
      "..bbbbbbbbbbbb..",
      "..aa........aa.."
    ],
    table: [
      "................",
      "................",
      "................",
      ".eeeeeeeeeeeeee.",
      ".dddddddddddddd.",
      ".cccccccccccccc.",
      ".bbbbbbbbbbbbbb.",
      "...cc......cc...",
      "...cc......cc...",
      "...cc......cc...",
      "...cc......cc...",
      "...cc......cc...",
      "...bb......bb...",
      "...bb......bb...",
      "..aaaa....aaaa..",
      "................"
    ],
    pantry: [
      ".cccccccccccccc.",
      ".cbbbbbbbbbbbbc.",
      ".cbeeeeeeeeeebc.",
      ".cbejjelleoobbc.",
      ".cbejjelleoobbc.",
      ".cbeeeeeeeeeebc.",
      ".cbbbbbbbbbbbbc.",
      ".cbeeeeeeeeeebc.",
      ".cbennelljjfbbc.",
      ".cbennelljjfbbc.",
      ".cbeeeeeeeeeebc.",
      ".cbbbbbbbbbbbbc.",
      ".cbbccccccccbbc.",
      ".cbboaaaaaaobbc.",
      ".cccccccccccccc.",
      "..aa........aa.."
    ],

    /* --- body / bedroom --- */
    bed: [
      "................",
      "...cccccccccc...",
      "..cddddddddddc..",
      "..cdffffffffdc..",
      "..cdfffffffddc..",
      "..jjjjjjjjjjjc..",
      "..jkkjjjjjkkjc..",
      "..jjjjjjjjjjjc..",
      "..jkkjjjjjkkjc..",
      "..jjjjjjjjjjjc..",
      "..cddddddddddc..",
      "..cccccccccccc..",
      "..bb........bb..",
      "..bb........bb..",
      "..aa........aa..",
      "................"
    ],
    nightstand: [
      "................",
      "................",
      ".....oooo.......",
      "....oqqqqo......",
      "....oqppqo......",
      ".....hhhh.......",
      "......hh........",
      "..dddddddddd....",
      "..cccccccccc....",
      "..cbbbbbbbbc....",
      "..cbaaaaaabc....",
      "..cbbbbbbbbc....",
      "..cccccccccc....",
      "..bb......bb....",
      "..aa......aa....",
      "................"
    ],
    wardrobe: [
      ".cccccccccccccc.",
      ".cddddddddddddc.",
      ".cdbbbbccbbbbdc.",
      ".cdbaaabcbaaabc.",
      ".cdbaaabcbaaabc.",
      ".cdbaaabcbaaabc.",
      ".cdbbbbccbbbbdc.",
      ".cdddddoodddddc.",
      ".cdbbbbccbbbbdc.",
      ".cdbaaabcbaaabc.",
      ".cdbaaabcbaaabc.",
      ".cdbaaabcbaaabc.",
      ".cdbbbbccbbbbdc.",
      ".cddddddddddddc.",
      ".cccccccccccccc.",
      "..aa........aa.."
    ],

    /* --- living --- */
    sofa: [
      "................",
      "................",
      "..llllllllllll..",
      ".lmllllllllllml.",
      ".lmllllllllllml.",
      ".lmllllllllllml.",
      ".lmllllllllllml.",
      "llmllllllllllmll",
      "lmmffffffffffmml",
      "lmmffffffffffmml",
      "lmmmmmmmmmmmmmml",
      ".mmmmmmmmmmmmmm.",
      ".mm..........mm.",
      "..bb........bb..",
      "..aa........aa..",
      "................"
    ],
    armchair: [
      "................",
      "................",
      "................",
      "....jjjjjjjj....",
      "...jkjjjjjjkj...",
      "...jkjjjjjjkj...",
      "...jkjjjjjjkj...",
      "..jjkjjjjjjkjj..",
      "..jkkffffffkkj..",
      "..jkkffffffkkj..",
      "..jkkkkkkkkkkj..",
      "...kkkkkkkkkk...",
      "...kk......kk...",
      "...bb......bb...",
      "...aa......aa...",
      "................"
    ],
    rug: [
      "................",
      "................",
      "................",
      "..jjjjjjjjjjjj..",
      ".jkkkkkkkkkkkkj.",
      ".jkffffffffffkj.",
      ".jkfjjjjjjjjfkj.",
      ".jkfjoooooojfkj.",
      ".jkfjoooooojfkj.",
      ".jkfjjjjjjjjfkj.",
      ".jkffffffffffkj.",
      ".jkkkkkkkkkkkkj.",
      "..jjjjjjjjjjjj..",
      "................",
      "................",
      "................"
    ],
    plant: [
      "................",
      "......nn........",
      ".....nnnn.n.....",
      "..n.nnnnnnnn....",
      ".nnnnnnnnnnnn...",
      ".nnmnnnnnnmnn...",
      "..nnnnnnnnnn....",
      "...nnnnnnnn.....",
      "....nnnnnn......",
      "......nn........",
      "......nn........",
      "....jjjjjj......",
      "....jkkkkj......",
      "....jkkkkj......",
      ".....jjjj.......",
      "................"
    ],
    bookshelf: [
      ".cccccccccccccc.",
      ".cddddddddddddc.",
      ".cbjjllnnjjoobc.",
      ".cbjjllnnjjoobc.",
      ".cbjjllnnjjoobc.",
      ".cdddddddddddc..",
      ".cbllooffjjnnbc.",
      ".cbllooffjjnnbc.",
      ".cbllooffjjnnbc.",
      ".cdddddddddddc..",
      ".cbnnjjooffllbc.",
      ".cbnnjjooffllbc.",
      ".cbnnjjooffllbc.",
      ".cddddddddddddc.",
      ".cccccccccccccc.",
      "..aa........aa.."
    ],

    /* --- craft --- */
    desk: [
      "................",
      "................",
      "......ffff......",
      ".....fttttf.....",
      ".eeeeeeeeeeeeee.",
      ".dddddddddddddd.",
      ".cccccccccccccc.",
      ".bbbbbbbbbbbbbb.",
      "..cc........cc..",
      "..cbbbbbbbbbcc..",
      "..cbaaaaaaabcc..",
      "..cbbbbbbbbbcc..",
      "..cc........cc..",
      "..bb........bb..",
      "..aa........aa..",
      "................"
    ],
    workbench: [
      "................",
      "...h...h...h....",
      "...h..hih..h....",
      "..hih..h..hih...",
      "...h......h.....",
      ".eeeeeeeeeeeeee.",
      ".cccccccccccccc.",
      ".bbbbbbbbbbbbbb.",
      "..cc........cc..",
      "..cc..oooo..cc..",
      "..cc..oaao..cc..",
      "..cc..oooo..cc..",
      "..cc........cc..",
      "..bb........bb..",
      "..aa........aa..",
      "................"
    ],
    toolrack: [
      "................",
      "..bbbbbbbbbbbb..",
      "..cccccccccccc..",
      "..a..h..a...h...",
      "..a..h..a...h...",
      "..a..h..a...h...",
      ".aaa.h.aaa..h...",
      "..c..h..c..hhh..",
      "..c.hhh.c...h...",
      "..c..h..c...h...",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],

    /* --- wall fittings --- */
    window: [
      "cccccccccccccccc",
      "cddddddddddddddc",
      "cdssssssssssssdc",
      "cdsrrrrrrrrrrsdc",
      "cdsrrrrrrrrrrsdc",
      "cdsrrrrrccrrrsdc",
      "cdsrrrrrccrrrsdc",
      "cdssssssccssssdc",
      "cdsccccccccccsdc",
      "cdsrrrrrccrrrsdc",
      "cdsrrrrrccrrrsdc",
      "cdsrrrrrccrrrsdc",
      "cdssssssssssssdc",
      "cddddddddddddddc",
      "cccccccccccccccc",
      ".cccccccccccccc."
    ],
    curtains: [
      "bbbbbbbbbbbbbbbb",
      "cccccccccccccccc",
      "jjj........jjj..",
      "jkj........jkj..",
      "jjj........jjj..",
      "jkj........jkj..",
      "jjjj......jjjj..",
      "jkjj......jjkj..",
      "jjjj......jjjj..",
      "jkjj......jjkj..",
      "jjjj......jjjj..",
      "jkjj......jjkj..",
      "jjjj......jjjj..",
      "jkj........jkj..",
      "jjj........jjj..",
      "................"
    ],
    sconce: [
      "................",
      "................",
      "......qq........",
      ".....qppq.......",
      ".....qppq.......",
      "......pp........",
      ".....oooo.......",
      "....oooooo......",
      "....oooooo......",
      ".....oooo.......",
      "......oo........",
      "......oo........",
      ".....oooo.......",
      "................",
      "................",
      "................"
    ],
    picture: [
      "................",
      "..oooooooooooo..",
      "..oaaaaaaaaaao..",
      "..oarrrrrrrrao..",
      "..oarrrnnrrrao..",
      "..oarrnnnnrrao..",
      "..oarnnnnnnrao..",
      "..oannnnnnnnao..",
      "..oannmmmmnnao..",
      "..oanmmmmmmnao..",
      "..oaaaaaaaaaao..",
      "..oooooooooooo..",
      "................",
      "................",
      "................",
      "................"
    ],
    shelf: [
      "................",
      "................",
      "...n..f..jj.o...",
      "..nnn.f..jj.oo..",
      "..nnn.ff.jj.oo..",
      "..ddddddddddddd.",
      "..ccccccccccccc.",
      "..bbbbbbbbbbbbb.",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    clock: [
      "................",
      "................",
      ".....cccc.......",
      "....cddddc......",
      "...cdffffdc.....",
      "...cdfaffdc.....",
      "...cdfaaffc.....",
      "...cdffffdc.....",
      "....cddddc......",
      ".....cccc.......",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    door: [
      "cccccccccccccccc",
      "cddddddddddddddc",
      "cdbbbbbbbbbbbbdc",
      "cdbccccccccccbdc",
      "cdbcaaaaaaaacbdc",
      "cdbcaaaaaaaacbdc",
      "cdbccccccccccbdc",
      "cdbbbbbbbbbbbbdc",
      "cdbbbbbbbboobbdc",
      "cdbccccccccccbdc",
      "cdbcaaaaaaaacbdc",
      "cdbcaaaaaaaacbdc",
      "cdbccccccccccbdc",
      "cdbbbbbbbbbbbbdc",
      "cddddddddddddddc",
      "cccccccccccccccc"
    ],
    mirror: [
      "................",
      "................",
      "....oooooooo....",
      "....orrrrrro....",
      "....orrrrrro....",
      "....orrfrrro....",
      "....orrrrrro....",
      "....orrrrrro....",
      "....orrrrrro....",
      "....orrrrrro....",
      "....oooooooo....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],

    /* --- community --- */
    guestchair: [
      "................",
      "................",
      "....llllllll....",
      "....lmllllml....",
      "....lmllllml....",
      "....lmllllml....",
      "....lmllllml....",
      "...llmllllmll...",
      "...lmmffffmml...",
      "...lmmmmmmmml...",
      "....mm....mm....",
      "....bb....bb....",
      "....bb....bb....",
      "....aa....aa....",
      "................",
      "................"
    ],
    mat: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "...cccccccccc...",
      "..cddddddddddc..",
      "..cdeeeeeeeedc..",
      "..cdeddddddedc..",
      "..cdeeeeeeeedc..",
      "..cddddddddddc..",
      "...cccccccccc...",
      "................"
    ]
  };

  /* ---- emit ------------------------------------------------------------
   * Horizontal runs are merged. A 16×16 grid is 256 pixels but usually well
   * under 60 rects, which is what keeps a room of thirty sprites cheap enough
   * to redraw on every render without any caching machinery. */
  function toSvg(grid) {
    if (!grid) return "";
    let out = "";
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        if (ch === "." || ch === " " || !PALETTE[ch]) { x++; continue; }
        let run = 1;
        while (x + run < row.length && row[x + run] === ch) run++;
        out += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${PALETTE[ch]}"/>`;
        x += run;
      }
    }
    return out;
  }

  const cache = Object.create(null);
  function sprite(name) {
    if (!(name in cache)) cache[name] = toSvg(SPRITES[name] || TILES[name]);
    return cache[name];
  }
  function has(name) { return !!(SPRITES[name] || TILES[name]); }

  /* Every sprite is drawn into a 16×16 box; a symbol per name lets the room and
   * the shop list share one definition and reference it by id. */
  function defs() {
    const names = Object.keys(SPRITES).concat(Object.keys(TILES));
    return names.map((n) =>
      `<symbol id="t-${n}" viewBox="0 0 ${SIZE} ${SIZE}">${sprite(n)}</symbol>`
    ).join("");
  }

  return { SIZE, PALETTE, TILES, SPRITES, sprite, defs, has, names: () => Object.keys(SPRITES) };
});
