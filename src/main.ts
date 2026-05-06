import "./styles/global.css";
import "./components/mami-tabs";
import "./components/mami-ambient-player";
import "./components/mami-settings";
import { registerSW } from "virtual:pwa-register";

// Componente lazy — 3 valuri pentru TBT redus
const ric: (cb: () => void, opts?: { timeout?: number }) => void =
  "requestIdleCallback" in window
    ? (window as any).requestIdleCallback
    : (cb) => setTimeout(cb, 100);

// Val 1 — componente cel mai des folosite
ric(
  () => {
    void import("./components/mami-wellness");
    void import("./components/mami-chat");
    void import("./components/mami-notes");
    void import("./components/mami-medication");
  },
  { timeout: 2000 },
);

// Val 2 — viewer-e documente/imagini
ric(
  () => {
    void import("./components/mami-doc-viewer");
    void import("./components/mami-image-viewer");
  },
  { timeout: 3000 },
);

// Val 3 — funcții avansate
ric(
  () => {
    void import("./components/mami-gallery");
    void import("./components/mami-menu");
    void import("./components/mami-drug-checker");
    void import("./components/mami-voice-memo");
    void import("./components/mami-doc-library");
  },
  { timeout: 4000 },
);

// Restore dark mode setting before paint (avoid flash)
if (localStorage.getItem("mami-dark") === "true") {
  document.documentElement.classList.add("dark");
}

// T7.A.2 — Restore font size before paint (accesibilitate utilizator vârstnic)
const fontScale = localStorage.getItem("mami-font-size");
if (fontScale === "1.25" || fontScale === "1.5") {
  document.documentElement.style.setProperty(
    "--font-base",
    `${18 * Number(fontScale)}px`,
  );
}

// T7.A.1 — Hide boot skeleton when mami-tabs is ready (event) or after 3s fallback
function dismissBootSkeleton(): void {
  const sk = document.getElementById("boot-skeleton");
  if (!sk || sk.classList.contains("fading")) return;
  sk.classList.add("fading");
  setTimeout(() => sk.remove(), 300);
}
document.addEventListener("mami-tabs-ready", dismissBootSkeleton, {
  once: true,
});
setTimeout(dismissBootSkeleton, 3000);

// Offline/online indicator
function updateOnlineStatus(): void {
  document.body.classList.toggle("offline", !navigator.onLine);
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
updateOnlineStatus();

// Service Worker registration with update notification
const updateSW = registerSW({
  onNeedRefresh() {
    // Aplică update automat — reload silențios
    void updateSW(true);
  },
  onOfflineReady() {
    console.info("[SW] App gata pentru utilizare offline");
  },
});

const app = document.getElementById("app");
if (app) {
  app.innerHTML =
    "<mami-tabs></mami-tabs><mami-ambient-player></mami-ambient-player><mami-settings></mami-settings>";
}

// Open settings modal when mami-tabs dispatches the event
document.addEventListener("mami-open-settings", () => {
  const settings = document.querySelector("mami-settings");
  settings?.setAttribute("open", "");
});

// T7.D.1 — Handle PWA Share Target receipt
async function handleShareTarget(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  if (params.get("share-target") !== "ready") return;
  try {
    const cache = await caches.open("share-target-temp");
    const fileResp = await cache.match("/__shared-file__");
    const textResp = await cache.match("/__shared-text__");
    let file: File | null = null;
    if (fileResp) {
      const buf = await fileResp.arrayBuffer();
      const filename = decodeURIComponent(
        fileResp.headers.get("X-Mami-Filename") ?? "shared",
      );
      const type =
        fileResp.headers.get("Content-Type") ?? "application/octet-stream";
      file = new File([buf], filename, { type });
      await cache.delete("/__shared-file__");
    }
    let text = "";
    if (textResp) {
      text = await textResp.text();
      await cache.delete("/__shared-text__");
    }
    if (file || text) {
      document.dispatchEvent(
        new CustomEvent("mami-share-received", {
          detail: { file, text },
          bubbles: true,
        }),
      );
    }
    // Curăță URL-ul
    window.history.replaceState({}, "", "/");
  } catch (err) {
    console.warn("[share-target] failed:", err);
  }
}
void handleShareTarget();
