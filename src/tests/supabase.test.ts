import { describe, it, expect, beforeEach } from "vitest";
import { deviceId } from "../data/supabase";

describe("T6.1 deviceId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("generează un id la prima invocare", () => {
    const id = deviceId();
    expect(id).toMatch(/.+/);
    expect(localStorage.getItem("mami:device-id")).toBe(id);
  });

  it("returnează același id la apeluri repetate (stabil per browser)", () => {
    const a = deviceId();
    const b = deviceId();
    const c = deviceId();
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("respectă valoarea pre-existentă în localStorage", () => {
    localStorage.setItem("mami:device-id", "manual-set-id");
    expect(deviceId()).toBe("manual-set-id");
  });

  it("formatul implicit e UUID v4 (36 chars cu cratime)", () => {
    const id = deviceId();
    // crypto.randomUUID() în jsdom returnează UUID v4 standard
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("ID-uri diferite în 2 storage-uri diferite (simulare 2 device-uri)", () => {
    const a = deviceId();
    localStorage.clear();
    const b = deviceId();
    expect(a).not.toBe(b);
  });
});
