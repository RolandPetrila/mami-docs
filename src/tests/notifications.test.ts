import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendNtfyNotification,
  makeVoiceCall,
  notify,
  showLocalNotification,
  isHydrationReminderEnabled,
  setHydrationReminderEnabled,
  stopHydrationReminder,
  PRIORITY_MAP,
} from "../services/notifications";

// jsdom nu are Notification — definim mock global
const mockNotification = vi.fn();
mockNotification.permission = "granted";
mockNotification.requestPermission = vi.fn().mockResolvedValue("granted");
// @ts-ignore
globalThis.Notification = mockNotification;
Object.defineProperty(mockNotification, "permission", {
  get: () => "granted",
  configurable: true,
});

beforeEach(() => {
  vi.restoreAllMocks();
  mockNotification.mockClear();
  localStorage.clear();
});

// ---- PRIORITY_MAP ----

describe("PRIORITY_MAP", () => {
  it("info → 3", () => {
    expect(PRIORITY_MAP["info"]).toBe(3);
  });
  it("warning → 4", () => {
    expect(PRIORITY_MAP["warning"]).toBe(4);
  });
  it("critical → 5", () => {
    expect(PRIORITY_MAP["critical"]).toBe(5);
  });
});

// ---- showLocalNotification ----

describe("showLocalNotification", () => {
  it("creează Notification cu titlul default când lipsește opts.title", () => {
    showLocalNotification({ message: "Test mesaj" });
    expect(mockNotification).toHaveBeenCalledWith(
      "Mami Docs",
      expect.objectContaining({ body: "Test mesaj" }),
    );
  });

  it("folosește titlul specificat", () => {
    showLocalNotification({ title: "Hidratare", message: "Bea apă!" });
    expect(mockNotification).toHaveBeenCalledWith(
      "Hidratare",
      expect.objectContaining({ body: "Bea apă!" }),
    );
  });

  it("requireInteraction true doar la critical", () => {
    showLocalNotification({ message: "critic!", level: "critical" });
    expect(mockNotification).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ requireInteraction: true }),
    );
  });

  it("requireInteraction false la info", () => {
    showLocalNotification({ message: "info", level: "info" });
    expect(mockNotification).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ requireInteraction: false }),
    );
  });
});

// ---- sendNtfyNotification ----

describe("sendNtfyNotification", () => {
  it("returnează true la răspuns ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 200 }),
    );
    const ok = await sendNtfyNotification({ message: "test", level: "info" });
    expect(ok).toBe(true);
  });

  it("returnează false la răspuns non-ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 500 }),
    );
    const ok = await sendNtfyNotification({ message: "test", level: "info" });
    expect(ok).toBe(false);
  });

  it("returnează false la eroare de rețea", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("network"),
    );
    const ok = await sendNtfyNotification({ message: "test" });
    expect(ok).toBe(false);
  });

  it("trimite Priority corect pentru warning", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    await sendNtfyNotification({ message: "atenție", level: "warning" });
    const headers = (spy.mock.calls[0]![1] as RequestInit).headers as Record<
      string,
      string
    >;
    expect(headers["Priority"]).toBe("4");
  });
});

// ---- makeVoiceCall ----

describe("makeVoiceCall", () => {
  it("returnează true la succes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 200 }),
    );
    const ok = await makeVoiceCall("Ia medicamentele!");
    expect(ok).toBe(true);
  });

  it("returnează false la eroare", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("fail"));
    const ok = await makeVoiceCall("test");
    expect(ok).toBe(false);
  });

  it("URL conține textul encodat", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    await makeVoiceCall("Ia medicamentele");
    const url = spy.mock.calls[0]![0] as string;
    expect(url).toContain("Ia+medicamentele");
  });
});

// ---- notify (combined) ----

describe("notify", () => {
  it("apelează showLocalNotification + ntfy când NTFY_URL e setat", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 200 }),
    );
    await notify({ message: "test", level: "info" });
    expect(mockNotification).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1); // ntfy call
  });

  it("apelează voice doar la level critical + voice: true", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));
    await notify({ message: "critic", level: "critical", voice: true });
    // ntfy (1) + CallMeBot (1) = 2 fetch calls
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("nu apelează voice la level info chiar dacă voice: true", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));
    await notify({ message: "info", level: "info", voice: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1); // doar ntfy
  });
});

// ---- Hydration reminder toggle ----

describe("isHydrationReminderEnabled", () => {
  it("returnează false implicit", () => {
    expect(isHydrationReminderEnabled()).toBe(false);
  });

  it("setHydrationReminderEnabled persistă în localStorage", () => {
    setHydrationReminderEnabled(true);
    expect(localStorage.getItem("mami:hydration-reminder-enabled")).toBe(
      "true",
    );
    stopHydrationReminder(); // cleanup timer
  });

  it("setHydrationReminderEnabled(false) oprește timer", () => {
    setHydrationReminderEnabled(true);
    setHydrationReminderEnabled(false);
    expect(isHydrationReminderEnabled()).toBe(false);
  });
});
