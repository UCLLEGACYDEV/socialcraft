import { describe, it, expect, beforeEach } from "vitest";
import {
  readStore,
  writeStore,
  getBrandProfiles,
  getSocialChannels,
  getScheduledPosts,
  addScheduledPost,
  addScheduledPostsBatch,
  deleteScheduledPost,
  updateScheduledPost,
  addCarouselDraft,
  addSeriesJob,
  getSeriesQueue,
  deleteSeriesJob,
  clearSeriesQueue,
  syncStoreWithClient,
} from "../../mcp/store";
import { computeNextSlots, DEFAULT_POSTING_SLOTS } from "../scheduling";
import { sanitizeNoGedankenstriche } from "../caption-generator";

describe("SocialCraft MCP Tools & Store", () => {
  beforeEach(() => {
    // Reset test store
    const store = readStore();
    store.scheduledPosts = [];
    store.carousels = [];
    store.seriesQueue = [];
    writeStore(store);
  });

  it("loads brand profiles and social channels", () => {
    const profiles = getBrandProfiles();
    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles.some((p) => p.slug === "zitate_tiger" || p.slug === "main")).toBe(true);

    const channels = getSocialChannels();
    expect(channels.length).toBeGreaterThan(0);
  });

  it("calculates posting slots without collision", () => {
    const existing = [Date.now() + 3600 * 1000];
    const slots = computeNextSlots(DEFAULT_POSTING_SLOTS, 5, existing);
    expect(slots.length).toBe(5);
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].getTime()).toBeGreaterThan(slots[i - 1].getTime());
    }
  });

  it("sanitizes Gedankenstriche according to SocialCraft copywriting rules", () => {
    const raw = "Problem – Lösung: Hier ist der Plan - mit Aufzählung – und mehr!";
    const cleaned = sanitizeNoGedankenstriche(raw);
    expect(cleaned).not.toContain(" – ");
    expect(cleaned).not.toContain(" — ");
  });

  it("creates, updates and deletes scheduled posts via MCP store", () => {
    const newPost = addScheduledPost({
      title: "KI Revolution 2026",
      caption: "Entdecke die neuen Features • Jetzt ausprobieren!",
      hashtags: ["#ai", "#creator"],
      platform: "instagram",
      channelId: "ig-main-account",
      scheduledFor: new Date(Date.now() + 86400 * 1000).toISOString(),
      status: "scheduled",
      mediaType: "image",
      mediaUrls: ["https://images.unsplash.com/photo-1"],
    });

    expect(newPost.id).toBeDefined();
    expect(newPost.status).toBe("scheduled");

    const postsAfterAdd = getScheduledPosts();
    expect(postsAfterAdd.length).toBe(1);
    expect(postsAfterAdd[0].title).toBe("KI Revolution 2026");

    // Update
    const updated = updateScheduledPost(newPost.id, { title: "KI Revolution 2026 (Updated)" });
    expect(updated?.title).toBe("KI Revolution 2026 (Updated)");

    // Delete
    const deleted = deleteScheduledPost(newPost.id);
    expect(deleted).toBe(true);
    expect(getScheduledPosts().length).toBe(0);
  });

  it("creates a multi-post batch schedule", () => {
    const batch = addScheduledPostsBatch([
      {
        title: "Post 1",
        caption: "Caption 1",
        hashtags: ["#test1"],
        platform: "tiktok",
        channelId: "tt-main",
        scheduledFor: new Date(Date.now() + 7200 * 1000).toISOString(),
        status: "scheduled",
        mediaType: "image",
        mediaUrls: [],
      },
      {
        title: "Post 2",
        caption: "Caption 2",
        hashtags: ["#test2"],
        platform: "instagram",
        channelId: "ig-main-account",
        scheduledFor: new Date(Date.now() + 14400 * 1000).toISOString(),
        status: "scheduled",
        mediaType: "carousel",
        mediaUrls: [],
      },
    ]);

    expect(batch.length).toBe(2);
    expect(getScheduledPosts().length).toBe(2);
  });

  it("stores and retrieves carousel drafts", () => {
    const draft = addCarouselDraft({
      title: "5 Hebel für mehr Reichweite",
      topic: "Social Media Growth",
      audience: "Creator & Brands",
      slides: [
        {
          slideNumber: 1,
          role: "hook",
          headline: "Hör auf täglich zu posten",
          subtext: "Mach stattdessen diese 3 Dinge.",
          visualPrompt: "Dramatic contrast, dark luxury studio lighting --ar 4:5",
        },
        {
          slideNumber: 2,
          role: "closing",
          headline: "Speichere dir diesen Post",
          subtext: "Folge @socialcraft für tägliche Strategien.",
          visualPrompt: "Clean minimal aesthetic with vibrant glow --ar 4:5",
        },
      ],
    });

    expect(draft.id).toBeDefined();
    expect(draft.slides.length).toBe(2);
  });

  it("adds and deletes series jobs and does not revive deleted jobs on sync", () => {
    const job = addSeriesJob({
      id: "test-series-1",
      topic: "Test Series Topic",
      audience: "Everyone",
      status: "queued",
      slidesTotal: 1,
      slidesDone: 0,
      slides: [],
      createdAt: new Date(Date.now() - 120_000).toISOString(),
    });

    expect(getSeriesQueue().some((j: any) => j.id === "test-series-1")).toBe(true);

    // Explicit delete
    const deleted = deleteSeriesJob("test-series-1");
    expect(deleted).toBe(true);
    expect(getSeriesQueue().some((j: any) => j.id === "test-series-1")).toBe(false);

    // Sync with empty queue does not revive the old job
    const updated = syncStoreWithClient({ seriesQueue: [] });
    expect(updated.seriesQueue.some((j: any) => j.id === "test-series-1")).toBe(false);
  });
});
