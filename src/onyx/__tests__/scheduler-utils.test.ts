import { describe, it, expect } from "vitest";
import {
  toLocalDatetimeValue,
  parseLocalDatetimeValue,
  formatMetric,
  slidesToOrderedUrls,
} from "../components/widgets/scheduler-utils";
import type { SlideContent } from "../types";

describe("scheduler-utils", () => {
  describe("toLocalDatetimeValue and parseLocalDatetimeValue", () => {
    it("formats and parses local date correctly without timezone shift", () => {
      const d = new Date(2026, 8, 15, 14, 30); // 15 Sep 2026 14:30
      const formatted = toLocalDatetimeValue(d);
      expect(formatted).toBe("2026-09-15T14:30");

      const parsed = parseLocalDatetimeValue(formatted);
      expect(parsed).not.toBeNull();
      expect(parsed?.getFullYear()).toBe(2026);
      expect(parsed?.getMonth()).toBe(8);
      expect(parsed?.getDate()).toBe(15);
      expect(parsed?.getHours()).toBe(14);
      expect(parsed?.getMinutes()).toBe(30);
    });

    it("returns null for empty string in parseLocalDatetimeValue", () => {
      expect(parseLocalDatetimeValue("")).toBeNull();
    });
  });

  describe("formatMetric", () => {
    it("formats thousands as k", () => {
      expect(formatMetric(1500)).toBe("1.5k");
      expect(formatMetric(999)).toBe("999");
    });

    it("formats millions as M", () => {
      expect(formatMetric(2500000)).toBe("2.5M");
    });

    it("handles null and undefined gracefully", () => {
      expect(formatMetric(null)).toBe("–");
      expect(formatMetric(undefined)).toBe("–");
    });
  });

  describe("slidesToOrderedUrls", () => {
    it("orders slide image URLs by slideNumber", () => {
      const mockSlides: SlideContent[] = [
        {
          id: "2",
          slideNumber: 2,
          imageUrl: "https://example.com/slide2.jpg",
          role: "concept",
          roleLabel: "Konzept",
          headline: "H2",
          subtext: "S2",
          coreMetaphor: "",
          primaryProps: [],
          visualPrompt: "",
        },
        {
          id: "1",
          slideNumber: 1,
          imageUrl: "https://example.com/slide1.jpg",
          role: "hook",
          roleLabel: "Hook",
          headline: "H1",
          subtext: "S1",
          coreMetaphor: "",
          primaryProps: [],
          visualPrompt: "",
        },
      ];

      const ordered = slidesToOrderedUrls(mockSlides);
      expect(ordered).toEqual([
        "https://example.com/slide1.jpg",
        "https://example.com/slide2.jpg",
      ]);
    });
  });
});
