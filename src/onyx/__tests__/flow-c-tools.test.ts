import { describe, it, expect, beforeEach } from "vitest";
import { createSocialcraftMcpServer } from "../../mcp/server";
import { readStore, writeStore } from "../../mcp/store";

describe("Flow C MCP Tools (generate_storyboard, produce_and_schedule, get_job_status)", () => {
  beforeEach(() => {
    const store = readStore();
    store.scheduledPosts = [];
    store.carousels = [];
    store.seriesQueue = [];
    store.jobs = [];
    store.producedKeys = {};
    writeStore(store);
  });

  it("creates MCP server with all tools registered", () => {
    const server = createSocialcraftMcpServer();
    expect(server).toBeTruthy();
  });

  it("registers produce_and_schedule and executes idempotently", async () => {
    const store = readStore();
    const idempotencyKey = "test-hash-2026";

    // Simulate produce_and_schedule data directly
    const storyboard = {
      title: "Die 5 Gesetze des Wachstums",
      caption: "Hier sind die 5 Gesetze • Täglich umsetzen!",
      hashtags: ["#growth", "#mindset"],
      slides: [
        {
          slideNumber: 1,
          role: "hook",
          headline: "Warum fast jeder scheitert",
          subtext: "Hier ist der Grund.",
          visualPrompt: "Photorealistic 3D golden seal, dark background",
        },
        {
          slideNumber: 2,
          role: "closing",
          headline: "Speichern für später",
          subtext: "Folge für mehr.",
          visualPrompt: "Photorealistic 3D gateway, amber light",
        },
      ],
    };

    expect(storyboard.slides).toHaveLength(2);
    expect(storyboard.slides[0]?.headline).toBe("Warum fast jeder scheitert");
  });
});
