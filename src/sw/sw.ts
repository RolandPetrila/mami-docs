import type { PrecacheEntry } from "workbox-precaching";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// Augment self with ServiceWorkerGlobalScope + __WB_MANIFEST (injected by vite-plugin-pwa)
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: PrecacheEntry[];
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Preia controlul imediat la update — fără banner, fără așteptare tab închis
self.addEventListener("install", () => {
  void self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

// CacheFirst for document and media files — served from cache, refreshed on demand
registerRoute(
  ({ url }: { url: URL }) =>
    /\.(docx|pdf|xlsx|jpe?g|png|gif|webp|svg|mp3)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: "documents-v1",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  }),
);

// T7.D.1 — PWA Share Target.
// Browser face POST cu multipart/form-data la "/?share-target=1".
// Salvăm fișierul într-un Cache temporar și redirecționăm la / unde main.ts
// preia fișierul + îl deschide în doc-viewer.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method === "POST" &&
    url.pathname === "/" &&
    url.searchParams.get("share-target") === "1"
  ) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get("file") as File | null;
          const text =
            (formData.get("text") as string | null) ??
            (formData.get("title") as string | null) ??
            "";
          if (file && file.size > 0) {
            const cache = await caches.open("share-target-temp");
            const buf = await file.arrayBuffer();
            await cache.put(
              "/__shared-file__",
              new Response(buf, {
                headers: {
                  "Content-Type": file.type || "application/octet-stream",
                  "X-Mami-Filename": encodeURIComponent(file.name),
                },
              }),
            );
          }
          if (text) {
            const cache = await caches.open("share-target-temp");
            await cache.put(
              "/__shared-text__",
              new Response(text, {
                headers: { "Content-Type": "text/plain;charset=utf-8" },
              }),
            );
          }
        } catch (err) {
          console.warn("[sw] share-target failed:", err);
        }
        return Response.redirect("/?share-target=ready", 303);
      })(),
    );
  }
});
