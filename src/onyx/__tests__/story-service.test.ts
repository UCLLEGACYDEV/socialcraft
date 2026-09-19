import { describe, expect, it } from "vitest";
import {
  buildSlideVisualPrompt,
  generateAlgorithmicStoryboard,
  getSlideRoleSequence,
  shouldIncludeCloneOnSlide,
} from "../story-service";
import type { StoryBrief } from "../types";

describe("StoryService & Storyboard Generation", () => {
  it("computes correct psychological slide role sequences", () => {
    expect(getSlideRoleSequence(2)).toEqual(["hook", "closing"]);
    expect(getSlideRoleSequence(4)).toEqual(["hook", "pain_point", "concept", "closing"]);
    expect(getSlideRoleSequence(6)).toEqual([
      "hook",
      "pain_point",
      "concept",
      "expansion",
      "proof",
      "closing",
    ]);
    expect(getSlideRoleSequence(7)).toHaveLength(7);
    expect(getSlideRoleSequence(7)[0]).toBe("hook");
    expect(getSlideRoleSequence(7)[6]).toBe("closing");
  });

  it("handles clone placement rules correctly", () => {
    // hook_closing: only slide 1 and last slide
    expect(shouldIncludeCloneOnSlide(1, 6, "hook_closing")).toBe(true);
    expect(shouldIncludeCloneOnSlide(2, 6, "hook_closing")).toBe(false);
    expect(shouldIncludeCloneOnSlide(6, 6, "hook_closing")).toBe(true);

    // all_slides
    expect(shouldIncludeCloneOnSlide(3, 6, "all_slides")).toBe(true);

    // even_slides
    expect(shouldIncludeCloneOnSlide(2, 6, "even_slides")).toBe(true);
    expect(shouldIncludeCloneOnSlide(3, 6, "even_slides")).toBe(false);
  });

  it("builds visual prompts incorporating style and clone prefix", () => {
    const prompt = buildSlideVisualPrompt({
      coreMetaphor: "goldenes Uhrwerk",
      topic: "Systeme statt Disziplin",
      slideNumber: 1,
      slideCount: 6,
      styleId: "ember-ignite",
      clonePrefix: "Modern founder in black turtleneck",
      clonePlacement: "hook_closing",
    });

    expect(prompt).toContain("Modern founder in black turtleneck");
    expect(prompt).toContain("goldenes Uhrwerk");
    expect(prompt).toContain("ember orange rimlight");
    expect(prompt).toContain("aspect ratio 4:5");
  });

  it("generates complete algorithmic storyboard without Gedankenstriche", () => {
    const brief: StoryBrief = {
      topic: "3 Hebel für sofortiges Instagram Wachstum",
      audience: "B2B Gründer",
      slideCount: 5,
      singleImageCount: 2,
      styleId: "ember-ignite",
    };

    const result = generateAlgorithmicStoryboard(brief);

    expect(result.carousel.slides).toHaveLength(5);
    expect(result.singles).toHaveLength(2);
    expect(result.carousel.title).toBeTruthy();
    expect(result.carousel.caption).toBeTruthy();
    expect(result.carousel.hashtags.length).toBeGreaterThan(0);

    // Verify strict ban of Gedankenstriche (–, —)
    for (const slide of result.carousel.slides) {
      expect(slide.headline).not.toMatch(/[–—]/);
      expect(slide.subtext).not.toMatch(/[–—]/);
      expect(slide.visualPrompt).toBeTruthy();
    }
    expect(result.carousel.caption).not.toMatch(/[–—]/);
  });
});
