import { describe, it, expect } from "vitest";
import { cleanPrompt, extractHeadlineAndSubtext, parseSlides } from "../parse-prompt-block";

describe("parse-prompt-block", () => {
  describe("cleanPrompt", () => {
    it("strips code fences and prompt prefixes", () => {
      const input = "```prompt\nPrompt: Ein dramatisches Bild eines Sportlers\n```";
      expect(cleanPrompt(input)).toBe("Ein dramatisches Bild eines Sportlers");
    });

    it("removes surrounding quotes", () => {
      const input = '"Ein minimalistisches Design mit hellem Licht"';
      expect(cleanPrompt(input)).toBe("Ein minimalistisches Design mit hellem Licht");
    });

    it("handles Visual Prompt: prefix", () => {
      const input = "Visual Prompt: Futuristisches Büro im Cyberpunk-Stil";
      expect(cleanPrompt(input)).toBe("Futuristisches Büro im Cyberpunk-Stil");
    });
  });

  describe("extractHeadlineAndSubtext", () => {
    it("extracts huge headline and subtext correctly", () => {
      const prompt =
        "Photo of a mountain scene, huge headline reading '10 SCHRITTE ZUM ERFOLG', subtext reading 'Die beste Strategie für 2026'";
      const res = extractHeadlineAndSubtext(prompt);
      expect(res.headline).toBe("10 SCHRITTE ZUM ERFOLG");
      expect(res.subtext).toBe("Die beste Strategie für 2026");
    });

    it("falls back gracefully when subtext is missing", () => {
      const prompt = "huge headline 'DER GROSSE WANDEL', cinematic lighting";
      const res = extractHeadlineAndSubtext(prompt);
      expect(res.headline).toBe("DER GROSSE WANDEL");
      expect(res.subtext).toBe("");
    });
  });

  describe("parseSlides", () => {
    it("parses structured slide headers", () => {
      const markdown = `
Slide 1: Hook
huge headline 'WARUM DIE MEISTEN SCHEITERN'
subtext 'Und wie du es besser machst'

Slide 2: Das Problem
huge headline 'FEHLENDER FOKUS'
subtext 'Zu viele Aufgaben gleichzeitig'
`;
      const slides = parseSlides(markdown);
      expect(slides).toHaveLength(2);
      expect(slides[0].slideNumber).toBe(1);
      expect(slides[0].headline).toBe("WARUM DIE MEISTEN SCHEITERN");
      expect(slides[0].subtext).toBe("Und wie du es besser machst");
      expect(slides[1].slideNumber).toBe(2);
      expect(slides[1].headline).toBe("FEHLENDER FOKUS");
    });

    it("handles JSON format gracefully", () => {
      const json = JSON.stringify([
        {
          slideNumber: 1,
          title: "Cover",
          headline: "Instagram Masterclass",
          subtext: "In 5 Schritten",
          prompt: "Ein stylisches Cover",
        },
      ]);
      const slides = parseSlides(json);
      expect(slides).toHaveLength(1);
      expect(slides[0].headline).toBe("Instagram Masterclass");
      expect(slides[0].slideNumber).toBe(1);
    });
  });
});
