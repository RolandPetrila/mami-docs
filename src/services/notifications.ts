// Stack notificări — funcționează în 4 straturi (toate opt-in):
//   1. Browser Notifications API (in-app, fără chei)
//   2. ntfy.sh push (URL public, fără cheie — admin alege topic)
//   3. Telegram Bot (cheie în Worker, niciodată în client)
//   4. CallMeBot voice (cheie + număr — Faza 2)
//
// Pentru reminder hidratare/medicament: combinație Notifications API local
// + opțional ntfy când app e închis. Folosește setInterval pe app deschis,
// localStorage pentru ultima notificare (anti-spam la refresh).

const NTFY_URL = import.meta.env.VITE_NTFY_URL as string | undefined;
const CALLMEBOT_API_KEY = import.meta.env.VITE_CALLMEBOT_API_KEY as
  | string
  | undefined;
const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER as string | undefined;

const HYDRATION_INTERVAL_MS = 2 * 60 * 60 * 1_000; // 2 ore
const HYDRATION_LAST_KEY = "mami:hydration-last-reminder";
const HYDRATION_ENABLED_KEY = "mami:hydration-reminder-enabled";

export type NotificationLevel = "info" | "warning" | "critical";

export interface NotifyOptions {
  title?: string;
  message: string;
  level?: NotificationLevel;
  tags?: string;
  /** Dacă true, încearcă apel voce pe lângă notificare push. */
  voice?: boolean;
}

export const PRIORITY_MAP: Record<NotificationLevel, number> = {
  info: 3,
  warning: 4,
  critical: 5,
};

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function showLocalNotification(opts: NotifyOptions): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  try {
    const n = new Notification(opts.title ?? "Mami Docs", {
      body: opts.message,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "mami-reminder",
      requireInteraction: opts.level === "critical",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (err) {
    console.warn("[notify] local notification failed:", err);
  }
}

export async function sendNtfyNotification(
  opts: NotifyOptions,
): Promise<boolean> {
  if (!NTFY_URL) return false;
  try {
    const resp = await fetch(NTFY_URL, {
      method: "POST",
      body: opts.message,
      headers: {
        Title: opts.title ?? "Mami Docs",
        Priority: String(PRIORITY_MAP[opts.level ?? "info"]),
        Tags: opts.tags ?? "bell",
      },
    });
    return resp.ok;
  } catch (err) {
    console.error("[notify] ntfy failed:", err);
    return false;
  }
}

export async function makeVoiceCall(text: string): Promise<boolean> {
  if (!CALLMEBOT_API_KEY || !PHONE_NUMBER) return false;
  try {
    const url = new URL("https://api.callmebot.com/start.php");
    url.searchParams.set("user", PHONE_NUMBER);
    url.searchParams.set("text", text);
    url.searchParams.set("lang", "ro-RO-Standard-A");
    url.searchParams.set("rpt", "2");
    url.searchParams.set("apikey", CALLMEBOT_API_KEY);
    const resp = await fetch(url.toString(), { method: "GET" });
    return resp.ok;
  } catch (err) {
    console.error("[notify] CallMeBot failed:", err);
    return false;
  }
}

/** Notificare combinată: local + ntfy (dacă URL configurat) + voce (opt-in). */
export async function notify(opts: NotifyOptions): Promise<void> {
  showLocalNotification(opts);
  if (NTFY_URL) {
    await sendNtfyNotification(opts);
  }
  if (opts.voice && opts.level === "critical") {
    await makeVoiceCall(opts.message);
  }
}

// ---- Hydration reminder ----

let _hydrationTimer: number | null = null;

export function isHydrationReminderEnabled(): boolean {
  return localStorage.getItem(HYDRATION_ENABLED_KEY) === "true";
}

export function setHydrationReminderEnabled(enabled: boolean): void {
  localStorage.setItem(HYDRATION_ENABLED_KEY, enabled ? "true" : "false");
  if (enabled) {
    void startHydrationReminder();
  } else {
    stopHydrationReminder();
  }
}

export async function startHydrationReminder(): Promise<void> {
  await requestNotificationPermission();
  stopHydrationReminder();
  // Tick la fiecare 5 min: dacă > HYDRATION_INTERVAL_MS de la ultima notif, notifică.
  _hydrationTimer = window.setInterval(
    () => {
      const last = parseInt(
        localStorage.getItem(HYDRATION_LAST_KEY) ?? "0",
        10,
      );
      if (Date.now() - last >= HYDRATION_INTERVAL_MS) {
        void notify({
          title: "💧 Pauză de apă",
          message: "Nu uita să bei un pahar de apă!",
          level: "info",
          tags: "droplet",
        });
        localStorage.setItem(HYDRATION_LAST_KEY, String(Date.now()));
      }
    },
    5 * 60 * 1_000,
  );
}

export function stopHydrationReminder(): void {
  if (_hydrationTimer !== null) {
    clearInterval(_hydrationTimer);
    _hydrationTimer = null;
  }
}

// Auto-start dacă utilizatorul a activat anterior reminder-ul.
if (typeof window !== "undefined" && isHydrationReminderEnabled()) {
  void startHydrationReminder();
}
