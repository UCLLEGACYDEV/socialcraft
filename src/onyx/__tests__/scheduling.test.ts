import { describe, it, expect } from "vitest";
import { computeNextSlots, DEFAULT_POSTING_SLOTS, type PostingSlotConfig } from "../scheduling";

describe("scheduling logic", () => {
  it("generates slots in the future", () => {
    const config: PostingSlotConfig = {
      days: [1, 2, 3, 4, 5],
      times: ["10:00", "15:00"],
    };
    const count = 3;
    const now = Date.now();
    const slots = computeNextSlots(config, count, []);

    expect(slots).toHaveLength(count);
    for (const slot of slots) {
      expect(slot.getTime()).toBeGreaterThan(now);
      expect(config.days).toContain(slot.getDay());
    }
  });

  it("avoids clashes with already taken timestamps", () => {
    const config: PostingSlotConfig = {
      days: [1, 2, 3, 4, 5],
      times: ["12:00"],
    };

    // Calculate next slot first
    const initialSlots = computeNextSlots(config, 2, []);
    expect(initialSlots.length).toBeGreaterThan(0);

    const firstSlotTs = initialSlots[0].getTime();
    // Simulate firstSlotTs is already taken
    const withCollision = computeNextSlots(config, 1, [firstSlotTs]);

    expect(withCollision).toHaveLength(1);
    expect(withCollision[0].getTime()).not.toBe(firstSlotTs);
  });
});
