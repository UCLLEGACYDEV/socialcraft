import { describe, it, expect } from "vitest";
import { TAB_ROUTE_MAP, ROUTE_TAB_MAP } from "../../routes/index";
import type { TabKey } from "../types";

describe("Route and Tab Mappings", () => {
  const allTabs: TabKey[] = [
    "carousel",
    "bulk",
    "direct-prompt",
    "scheduler",
    "ai-clone",
    "prompt-gallery",
    "history",
  ];

  it("has a unique route path for every Studio tab", () => {
    for (const tab of allTabs) {
      expect(TAB_ROUTE_MAP[tab]).toBeDefined();
      expect(TAB_ROUTE_MAP[tab].startsWith("/")).toBe(true);
    }
  });

  it("maps back bidirectionally from route path to TabKey", () => {
    for (const tab of allTabs) {
      const path = TAB_ROUTE_MAP[tab];
      expect(ROUTE_TAB_MAP[path]).toBe(tab);
    }
  });

  it("includes correct expected URLs", () => {
    expect(TAB_ROUTE_MAP.scheduler).toBe("/planer");
    expect(TAB_ROUTE_MAP.carousel).toBe("/studio");
    expect(TAB_ROUTE_MAP.bulk).toBe("/serie");
    expect(TAB_ROUTE_MAP.history).toBe("/galerie");
    expect(TAB_ROUTE_MAP["ai-clone"]).toBe("/klon");
    expect(TAB_ROUTE_MAP["prompt-gallery"]).toBe("/prompts");
    expect(TAB_ROUTE_MAP["direct-prompt"]).toBe("/einzelbild");
  });
});
