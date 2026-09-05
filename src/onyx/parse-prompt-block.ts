import type { ParsedCarousel, ParsedSlide } from "./types";

const CAROUSEL_SPLIT = /^\s*(?:={3,}|##\s*Karussell.*)\s*$/gim;
const SLIDE_HEAD = /^\s*(?:slide|folie)\s*(\d+)\s*[–—:\-.]?\s*(.*)$/i;

export function parseSlides(text: string): ParsedSlide[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // JSON array of slides
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed) as Array<Record<string, unknown>>;
      return arr.map((item, i) => ({
        slideNumber: Number(item["slideNumber"] ?? i + 1),
        title: String(item["title"] ?? item["headline"] ?? `Slide ${i + 1}`),
        prompt: String(item["prompt"] ?? item["visualPrompt"] ?? ""),
      }));
    } catch {
      /* fall through to text parsing */
    }
  }

  const lines = trimmed.split(/\r?\n/);
  const slides: ParsedSlide[] = [];
  let current: ParsedSlide | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current) {
      current.prompt = buffer.join("\n").trim();
      slides.push(current);
    }
    buffer = [];
  };

  for (const line of lines) {
    if (/^\s*-{3,}\s*$/.test(line)) continue;
    const match = line.match(SLIDE_HEAD);
    if (match) {
      flush();
      current = {
        slideNumber: Number(match[1]),
        title: (match[2] ?? "").trim() || `Slide ${match[1]}`,
        prompt: "",
      };
      continue;
    }
    if (current) buffer.push(line);
  }
  flush();

  if (slides.length === 0) {
    // No slide headers — treat separated blocks as slides
    const blocks = trimmed.split(/\n\s*\n/).filter((b) => b.trim());
    return blocks.map((b, i) => ({
      slideNumber: i + 1,
      title: `Slide ${i + 1}`,
      prompt: b.trim(),
    }));
  }

  return slides;
}

export function extractTitle(text: string, slides: ParsedSlide[]): string {
  const match = text.match(/^\s*(?:thema|topic|titel|title)\s*[:–—-]\s*(.+)$/im);
  if (match?.[1]) return match[1].trim();
  const heading = text.match(/^\s*#{1,3}\s*(.+)$/m);
  if (heading?.[1] && !/^slide/i.test(heading[1])) return heading[1].replace(/^Karussell\s*/i, "").trim();
  return slides[0]?.title ?? "Unbenanntes Karussell";
}

export function parseBlock(text: string): ParsedCarousel[] {
  if (!text.trim()) return [];
  const chunks = text
    .split(CAROUSEL_SPLIT)
    .map((c) => c.trim())
    .filter(Boolean);

  return chunks
    .map((raw) => {
      const slides = parseSlides(raw);
      const explicit = /^\s*(?:thema|topic|titel|title)\s*[:–—-]/im.test(raw);
      return {
        title: extractTitle(raw, slides),
        titleFromBlock: explicit,
        raw,
        slides,
      } satisfies ParsedCarousel;
    })
    .filter((c) => c.slides.length > 0);
}
