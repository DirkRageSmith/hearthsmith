/* Hearthsmith service worker.
 *
 * Offline-first, because the whole point is that a bad day with no signal is
 * still a day you can log. Cache-first for the shell; the ledger itself never
 * goes near here — it lives in localStorage and never leaves the device.
 *
 * Bump CACHE when any shell file changes, or a stale shell will be served
 * forever. That is the one maintenance cost of having no build step.
 */
const CACHE = "hearthsmith-v0.3.0";
const SHELL = [
  ".", "index.html", "profile.html",
  "ledger.js", "character.js",
  "catalog.json", "currencies.json",
  "manifest.json", "icon.svg"
];

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
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit || fetch(e.request).then((res) => {
        /* Refresh the cached copy opportunistically so an update lands next
           launch, but never fail the request because the network did. */
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => hit)
    )
  );
});
