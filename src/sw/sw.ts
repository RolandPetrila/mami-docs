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
