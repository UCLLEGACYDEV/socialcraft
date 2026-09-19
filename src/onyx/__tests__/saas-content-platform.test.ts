import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeminiAiProvider, defaultAiProvider } from "../../server/providers/ai-provider";
import { handleCloudApiRequest } from "../../server/cloud-api-router";
import { DEFAULT_BRAND_KIT, DEFAULT_AI_SKILLS } from "../defaults";

describe("SaaS Content Platform Provider & Endpoints", () => {
  const originalFetch = globalThis.fetch;
  const originalGeminiEnv = process.env["GEMINI_API_KEY"];

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env["GEMINI_API_KEY"];
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalGeminiEnv !== undefined) process.env["GEMINI_API_KEY"] = originalGeminiEnv;
    else delete process.env["GEMINI_API_KEY"];
  });

  describe("GeminiAiProvider", () => {
    it("generates structured content using algorithmic fallback when no key is set", async () => {
      const provider = new GeminiAiProvider();
      const res = await provider.generateContent({
        topic: "Warum 90% bei B2B scheitern",
        slideCount: 6,
        brandKit: DEFAULT_BRAND_KIT,
        skill: DEFAULT_AI_SKILLS[0],
      });

      expect(res.title).toBeDefined();
      expect(res.caption).toBeDefined();
      expect(res.hashtags.length).toBeGreaterThanOrEqual(1);
      expect(res.slides.length).toBe(6);
      expect(res.slides[0]?.role).toBe("hook");
      expect(res.slides[5]?.role).toBe("closing");
      expect(res.provider).toContain("algorithmic-fallback");
      expect(res.skillUsed).toBe(DEFAULT_AI_SKILLS[0]!.name);
    });

    it("parses structured Gemini JSON when API key is provided and upstream responds", async () => {
      const provider = new GeminiAiProvider();
      const fakeGeminiResponse = {
        title: "5 B2B Wachstums-Hacks",
        caption: "Hier sind die 5 wichtigsten Hebel für dein B2B Wachstum.",
        hashtags: ["#B2B", "#SaaS", "#Growth"],
        slides: [
          {
            slideNumber: 1,
            role: "hook",
            headline: "Warum B2B anders funktioniert",
            subtext: "Wer nur auf Zufall hofft, verliert.",
            coreMetaphor: "Titan-Tresor",
            englishPromptIdea: "photorealistic 3D titanium vault glowing, 4:5 vertical",
          },
          {
            slideNumber: 2,
            role: "closing",
            headline: "Jetzt umsetzen",
            subtext: "Speichere dir diesen Post.",
            coreMetaphor: "Goldener Schlüssel",
            englishPromptIdea: "photorealistic 3D golden key, 4:5 vertical",
          },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(fakeGeminiResponse) }],
              },
            },
          ],
        }),
      } as unknown as Response);

      const res = await provider.generateContent({
        topic: "5 B2B Wachstums-Hacks",
        slideCount: 2,
        brandKit: DEFAULT_BRAND_KIT,
        skill: DEFAULT_AI_SKILLS[0],
        apiKey: "fake_gemini_api_key_1234567890",
      });

      expect(res.title).toBe("5 B2B Wachstums-Hacks");
      expect(res.slides.length).toBe(2);
      expect(res.slides[0]?.headline).toBe("Warum B2B anders funktioniert");
      expect(res.provider).toContain("gemini");
    });

    it("rerolls a single slide prompt successfully", async () => {
      const provider = new GeminiAiProvider();
      const result = await provider.rerollSlidePrompt({
        topic: "Automatisierung",
        slideNumber: 2,
        slideCount: 6,
        brandKit: DEFAULT_BRAND_KIT,
      });

      expect(result.coreMetaphor).toBeDefined();
      expect(result.visualPrompt).toBeDefined();
      expect(result.visualPrompt).toContain("Photorealistic 3D");
    });
  });

  describe("Cloud API Router Endpoints", () => {
    it("handles POST /api/cloud/ai/generate-content and returns structured JSON", async () => {
      const req = new Request("http://localhost:8080/api/cloud/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "Social Media Automatisierung",
          slideCount: 4,
          brandKit: DEFAULT_BRAND_KIT,
          skill: DEFAULT_AI_SKILLS[1],
        }),
      });

      const res = await handleCloudApiRequest(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(200);

      const body = (await res?.json()) as {
        success: boolean;
        title: string;
        slides: unknown[];
      };
      expect(body.success).toBe(true);
      expect(body.title).toBeDefined();
      expect(body.slides.length).toBe(4);
    });

    it("handles POST /api/cloud/ai/reroll-slide-prompt", async () => {
      const req = new Request("http://localhost:8080/api/cloud/ai/reroll-slide-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "B2B Vertrieb",
          slideNumber: 3,
          slideCount: 7,
          brandKit: DEFAULT_BRAND_KIT,
        }),
      });

      const res = await handleCloudApiRequest(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(200);

      const body = (await res?.json()) as {
        success: boolean;
        visualPrompt: string;
        coreMetaphor: string;
      };
      expect(body.success).toBe(true);
      expect(body.visualPrompt).toBeDefined();
      expect(body.coreMetaphor).toBeDefined();
    });
  });
});
