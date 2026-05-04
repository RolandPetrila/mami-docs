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
  },
  { timeout: 4000 },
);

// Restore dark mode setting before paint (avoid flash)
if (localStorage.getItem("mami-dark") === "true") {
  document.documentElement.classList.add("dark");
}

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
