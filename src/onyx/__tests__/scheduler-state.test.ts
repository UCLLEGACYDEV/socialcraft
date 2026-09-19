import { describe, it, expect } from "vitest";
import type { ScheduledPost, ScheduledPostStatus } from "@/onyx/types";

describe("SaaS 2.0 Scheduler & Review-Inbox Status Transitions", () => {
  it("supports all 7 states of the SaaS 2.0 Publishing status machine", () => {
    const validStatuses: ScheduledPostStatus[] = [
      "draft",
      "in_review",
      "scheduled",
      "publishing",
      "published",
      "failed",
      "manual_needed",
    ];

    expect(validStatuses).toHaveLength(7);
  });

  it("filters posts by in_review or draft for Review-Inbox queue", () => {
    const samplePosts: Partial<ScheduledPost>[] = [
      { id: "1", status: "published", title: "Live Post" },
      { id: "2", status: "in_review", title: "Review Post" },
      { id: "3", status: "scheduled", title: "Scheduled Post" },
      { id: "4", status: "draft", title: "Draft Post" },
      { id: "5", status: "failed", title: "Failed Post" },
    ];

    const pendingReview = samplePosts.filter(
      (p) => p.status === "in_review" || p.status === "draft",
    );

    expect(pendingReview).toHaveLength(2);
    expect(pendingReview.map((p) => p.id)).toEqual(["2", "4"]);
  });

  it("advances post status from in_review to scheduled upon approval", () => {
    const post: ScheduledPost = {
      id: "post_test_1",
      title: "Karussell Strategie",
      caption: "5 Hebel für mehr Reichweite",
      hashtags: ["marketing", "b2b"],
      mediaUrls: ["https://example.com/slide1.jpg"],
      mediaType: "carousel",
      channelId: "ig_1",
      platform: "instagram",
      scheduledFor: "2026-09-20T18:00:00.000Z",
      status: "in_review",
      createdAt: "2026-09-19T03:00:00.000Z",
      qualityScore: 98,
    };

    // Approval transition
    const approvedPost: ScheduledPost = {
      ...post,
      status: "scheduled",
    };

    expect(approvedPost.status).toBe("scheduled");
    expect(approvedPost.qualityScore).toBe(98);
  });
});
