import { describe, expect, it } from "vitest";
import { TABS } from "../data/tabs";
import { PROMPTS, getSystemPrompt } from "../ai/system-prompts";

describe("system-prompts", () => {
  it("all defined tabs have a prompt entry", () => {
    for (const tab of TABS) {
      expect(PROMPTS[tab.id], `missing prompt for tab ${tab.id}`).toBeTruthy();
    }
  });

  it("getSystemPrompt returns non-empty for known tabs", () => {
    for (const tab of TABS) {
      const prompt = getSystemPrompt(tab.id);
      expect(prompt.length).toBeGreaterThan(50);
    }
  });

  it("getSystemPrompt returns fallback prompt for unknown tabs", () => {
    const prompt = getSystemPrompt("nonexistent-tab-xyz");
    expect(prompt).toContain("nonexistent-tab-xyz");
    expect(prompt.length).toBeGreaterThan(50);
  });

  it("medical-related prompts include disclaimer phrase", () => {
    for (const tabId of ["wellness", "medicamente", "tratament"]) {
      const prompt = PROMPTS[tabId];
      expect(prompt, `missing ${tabId}`).toBeDefined();
      expect(prompt!.toLowerCase()).toMatch(
        /medic|prescripție|consult|tratament/,
      );
    }
  });

  it("all prompts include honesty rule", () => {
    for (const tab of TABS) {
      const prompt = PROMPTS[tab.id];
      expect(prompt, `missing ${tab.id}`).toBeDefined();
      expect(prompt!.toLowerCase()).toMatch(/sigur|știu|verific|date/);
    }
  });
});
