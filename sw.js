/* Hearthsmith service worker.
 *
 * Offline-first, because the whole point is that a bad day with no signal is
 * still a day you can log. The ledger itself never goes near here — it lives
 * in localStorage and never leaves the device.
 *
 * STALE-WHILE-REVALIDATE for the shell: serve the cached copy instantly, and
 * ALWAYS refetch in the background so the next launch has the new one.
 *
 * Bump CACHE when any shell file changes — it is what makes an update land
 * *this* launch instead of the next one, and what evicts the old cache. Since
 * 0.4.0 `node tools/doctor.mjs` FAILS if a shell file changed without it, so
 * this is enforced rather than remembered. Update SHELL_HASH when it tells you
 * to; the doctor prints the value.
 */
const CACHE = "hearthsmith-v0.14.0";
const SHELL = [
  ".", "index.html", "profile.html", "room.html",
  "ledger.js", "character.js", "shop.js", "tiles.js",
  "catalog.json", "currencies.json", "shop.json",
  "manifest.json", "icon.svg"
];
/* sha256 of the SHELL files (sorted, concatenated), first 16 hex. Maintained by
 * tools/doctor.mjs — it is the mechanism that makes "bump CACHE" impossible to
 * forget rather than merely written down. */
const SHELL_HASH = "08a7906a72c8da65";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const req = e.request;

  /* Start the network request UNCONDITIONALLY — this is the whole fix.
   *
   * Until 0.4.0 this read `hit || fetch(...)`, which short-circuits: on a cache
   * hit the network was never touched, so the refresh below never ran. Shell
   * files are always cached, so the cache never refreshed and only a CACHE bump
   * could ship anything. The comment claimed stale-while-revalidate; the code
   * was cache-first-forever, and the only way to see an update was to reinstall.
   *
   * Same shape as the ADR-020 bug: the description was right, the code checked
   * something else, and nothing failed loudly. */
  const net = fetch(req).then((res) => {
    if (res && res.ok && res.type !== "opaque") {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
    }
    return res;
  });
  /* Keep the worker alive until the refetch finishes, or the put can be killed
   * mid-flight. Never let a network failure surface — offline is normal here. */
  e.waitUntil(net.catch(() => {}));

  /* Cached copy instantly when we have one; the refetch above updates it for
   * next launch. No cache means the network response, errors and all. */
  e.respondWith(caches.match(req).then((hit) => hit || net));
});
