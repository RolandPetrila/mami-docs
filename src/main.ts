import "./styles/global.css";
import "./components/mami-tabs";
import "./components/mami-ambient-player";
import { registerSW } from "virtual:pwa-register";

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
    const banner = document.createElement("div");
    banner.className = "update-banner";
    banner.innerHTML =
      'Versiune nouă disponibilă! <button id="sw-update">Actualizează</button>';
    document.body.prepend(banner);
    document.getElementById("sw-update")?.addEventListener("click", () => {
      void updateSW();
      banner.remove();
    });
  },
  onOfflineReady() {
    console.info("[SW] App gata pentru utilizare offline");
  },
});

const app = document.getElementById("app");
if (app) {
  app.innerHTML =
    "<mami-tabs></mami-tabs><mami-ambient-player></mami-ambient-player>";
}
