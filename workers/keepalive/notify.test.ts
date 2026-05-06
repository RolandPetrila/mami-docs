import { describe, it, expect, vi, beforeEach } from "vitest";
import worker from "./index";

type Env = Parameters<typeof worker.fetch>[1];

const BASE_ENV: Env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon",
  CALLMEBOT_API_KEY: "test-cb-key",
  CALLMEBOT_PHONE: "+40700000000",
  ALLOWED_ORIGIN: "https://mami-docs.pages.dev",
};

const ORIGIN = "https://mami-docs.pages.dev";

function notifyReq(body: unknown, origin = ORIGIN): Request {
  return new Request("https://kp.example.com/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ---- T6.2 /notify CallMeBot proxy ----

describe("POST /notify (T6.2 server-side CallMeBot)", () => {
  it("503 când CALLMEBOT_API_KEY lipsește", async () => {
    const env = { ...BASE_ENV, CALLMEBOT_API_KEY: undefined };
    const resp = await worker.fetch(notifyReq({ text: "Salut" }), env);
    expect(resp.status).toBe(503);
    const body = (await resp.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe("CallMeBot not configured");
  });

  it("503 când CALLMEBOT_PHONE lipsește", async () => {
    const env = { ...BASE_ENV, CALLMEBOT_PHONE: undefined };
    const resp = await worker.fetch(notifyReq({ text: "Salut" }), env);
    expect(resp.status).toBe(503);
  });

  it("400 fără text", async () => {
    const resp = await worker.fetch(notifyReq({}), BASE_ENV);
    expect(resp.status).toBe(400);
    const body = (await resp.json()) as { error: string };
    expect(body.error).toBe("text required");
  });

  it("400 când text e gol/whitespace", async () => {
    const resp = await worker.fetch(notifyReq({ text: "   " }), BASE_ENV);
    expect(resp.status).toBe(400);
  });

  it("400 când text > 500 chars", async () => {
    const long = "a".repeat(501);
    const resp = await worker.fetch(notifyReq({ text: long }), BASE_ENV);
    expect(resp.status).toBe(400);
    const body = (await resp.json()) as { error: string };
    expect(body.error).toContain("too long");
  });

  it("400 la JSON invalid", async () => {
    const bad = new Request("https://kp.example.com/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: "not-json{{",
    });
    const resp = await worker.fetch(bad, BASE_ENV);
    expect(resp.status).toBe(400);
  });

  it("403 Origin necunoscut (CORS strict)", async () => {
    const resp = await worker.fetch(
      notifyReq({ text: "Salut" }, "https://attacker.com"),
      BASE_ENV,
    );
    expect(resp.status).toBe(403);
  });

  it("200 + apelează CallMeBot cu params corecți la text valid", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const resp = await worker.fetch(
      notifyReq({ text: "Bea apă acum" }),
      BASE_ENV,
    );
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { ok: boolean };
    expect(body.ok).toBe(true);

    const calledUrl = fetchSpy.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("api.callmebot.com/start.php");
    expect(calledUrl).toContain("user=");
    expect(calledUrl).toContain("text=Bea+ap%C4%83+acum");
    expect(calledUrl).toContain("apikey=");
    expect(calledUrl).toContain("lang=ro-RO-Standard-A");
  });

  it("502 când CallMeBot eșuează", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("rate limited", { status: 429 }),
    );
    const resp = await worker.fetch(notifyReq({ text: "test" }), BASE_ENV);
    expect(resp.status).toBe(502);
  });

  it("502 când fetch aruncă (network error)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));
    const resp = await worker.fetch(notifyReq({ text: "test" }), BASE_ENV);
    expect(resp.status).toBe(502);
    const body = (await resp.json()) as { error: string };
    expect(body.error).toBe("CallMeBot unreachable");
  });
});

// ---- GET / (status) ----

describe("GET / (alive)", () => {
  it("200 cu mesaj plain text", async () => {
    const resp = await worker.fetch(
      new Request("https://kp.example.com/", {
        method: "GET",
        headers: { Origin: ORIGIN },
      }),
      BASE_ENV,
    );
    expect(resp.status).toBe(200);
    const text = await resp.text();
    expect(text).toContain("alive");
    expect(text).toContain("/notify");
  });
});

// ---- OPTIONS preflight ----

describe("OPTIONS /notify (CORS preflight)", () => {
  it("204 cu headers CORS pentru origin permis", async () => {
    const resp = await worker.fetch(
      new Request("https://kp.example.com/notify", {
        method: "OPTIONS",
        headers: { Origin: ORIGIN },
      }),
      BASE_ENV,
    );
    expect(resp.status).toBe(204);
    expect(resp.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(resp.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
  });
});
