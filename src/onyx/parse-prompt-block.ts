import type { ParsedCarousel, ParsedSlide } from "./types";

const CAROUSEL_SPLIT = /^\s*(?:={3,}|(?:\*{2}|#{1,3})?\s*(?:Karussell|Carousel)\s*\d*.*?(?:\*{2})?)\s*$/gim;

// Matches slide headers like:
// **Slide 1 – Hook/Cover**
// **Slide 1: Hook**
// ### Slide 1 – Hook
// Slide 1 - Hook
// **Folie 1 – Hook**
const SLIDE_HEAD = /^\s*(?:[#*_\-~>`\s]*)\b(?:slide|folie)\s*(\d+)\b[^\w\n]*([^*\n`]*?)(?:\s*[*_#`\s]*)$/i;

/**
 * Strips code fences (```), leading "Prompt:", surrounding quotes, and trailing summary notes.
 */
export function cleanPrompt(raw: string): string {
  let text = raw.trim();

  // If the prompt is enclosed in a markdown code block (``` ... ```), extract its contents
  const codeBlockMatch = text.match(/```(?:prompt|text|markdown)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1] !== undefined) {
    text = codeBlockMatch[1].trim();
  }

  // Remove leading "Prompt:" or "Prompt :" or "Visual Prompt:"
  text = text.replace(/^(?:visual\s+)?prompt\s*:\s*/i, "").trim();

  // Remove wrapping quotes if the whole prompt was in quotes
  text = text.replace(/^["'“”„]/, "").replace(/["'“”]$/, "").trim();

  return text;
}

/**
 * Intelligently extracts headline and subtext from the prompt body.
 */
export function extractHeadlineAndSubtext(prompt: string): { headline: string; subtext: string } {
  let headline = "";
  let subtext = "";

  // 1. Huge headline takes priority (e.g. huge headline '10 ZEICHEN FÜR VERDECKTEN NARZISSMUS')
  const hugeMatch =
    prompt.match(/huge\s+headline[^'\n]*reading\s+['"]([^'"]+)['"]/i) ||
    prompt.match(/huge\s+headline\s*['"]([^'"]+)['"]/i);

  if (hugeMatch && hugeMatch[1] !== undefined) {
    headline = hugeMatch[1].trim();
  } else {
    // Collect all headline reading matches and pick the main one
    const allHeadlines = [...prompt.matchAll(/headline[^'\n]*reading\s+['"]([^'"]+)['"]/gi)];
    const lastHeadline = allHeadlines[allHeadlines.length - 1];
    if (lastHeadline && lastHeadline[1] !== undefined) {
      headline = lastHeadline[1].trim();
    } else {
      const genericMatch =
        prompt.match(/headline\s*[:–-]?\s*['"]([^'"]+)['"]/i) ||
        prompt.match(/headline\s*:\s*([^\n]+)/i);
      if (genericMatch && genericMatch[1] !== undefined) {
        headline = genericMatch[1].trim();
      }
    }
  }

  // 2. Subtext (e.g. subtext ... reading '...')
  const sMatch =
    prompt.match(/subtext[^'\n]*reading\s+['"]([^'"]+)['"]/i) ||
    prompt.match(/subtext\s*[:–-]?\s*['"]([^'"]+)['"]/i);
  if (sMatch && sMatch[1] !== undefined) {
    subtext = sMatch[1].trim();
  }

  return { headline, subtext };
}

export function parseSlides(text: string): ParsedSlide[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // JSON array of slides
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed) as Array<Record<string, unknown>>;
      return arr.map((item, i) => {
        const p = cleanPrompt(String(item["prompt"] ?? item["visualPrompt"] ?? ""));
        const { headline, subtext } = extractHeadlineAndSubtext(p);
        return {
          slideNumber: Number(item["slideNumber"] ?? i + 1),
          title: String(item["title"] ?? item["roleLabel"] ?? `Slide ${i + 1}`),
          headline: String(item["headline"] ?? headline ?? item["title"] ?? `Slide ${i + 1}`),
          subtext: String(item["subtext"] ?? subtext ?? ""),
          prompt: p,
        };
      });
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
      const rawPrompt = buffer.join("\n").trim();
      const cleaned = cleanPrompt(rawPrompt);
      const { headline, subtext } = extractHeadlineAndSubtext(cleaned);
      current.prompt = cleaned;
      current.headline = headline || current.title;
      current.subtext = subtext;
      slides.push(current);
    }
    buffer = [];
  };

  for (const line of lines) {
    // If we encounter a horizontal rule between carousels, skip
    if (/^\s*-{3,}\s*$/.test(line)) continue;

    const match = line.match(SLIDE_HEAD);
    if (match) {
      flush();
      const num = Number(match[1]);
      let title = (match[2] ?? "").trim();
      title = title.replace(/^[–—:\-.\s]+|[–—:\-.\s*#_]+$/g, "").trim();
      current = {
        slideNumber: num,
        title: title || `Slide ${num}`,
        prompt: "",
        headline: "",
        subtext: "",
      };
      continue;
    }

    if (current) {
      buffer.push(line);
    }
  }
  flush();

  if (slides.length === 0) {
    // No slide headers found — treat separated paragraphs as slides
    const blocks = trimmed.split(/\n\s*\n/).filter((b) => b.trim());
    return blocks.map((b, i) => {
      const cleaned = cleanPrompt(b);
      const { headline, subtext } = extractHeadlineAndSubtext(cleaned);
      return {
        slideNumber: i + 1,
        title: `Slide ${i + 1}`,
        headline: headline || `Slide ${i + 1}`,
        subtext,
        prompt: cleaned,
      };
    });
  }

  return slides;
}

/**
 * Detects a trailing "Caption-Vorschlag" / "Caption" block at the end of a
 * raw carousel text, strips it out, and returns both the cleaned text and
 * the caption string. The caption section must NOT be counted as a slide.
 *
 * Matches headings like:
 *   **Caption-Vorschlag:**
 *   Caption-Vorschlag:
 *   **Caption:**
 *   Caption:
 *   ### Caption-Vorschlag
 */
const CAPTION_SECTION = /(?:^|\n)\s*(?:[*#_~`\s]*)(?:caption(?:-vorschlag)?|caption(?:\s*vorschlag)?)\s*:?(?:[*#_~`\s]*)\s*\n([\s\S]*)$/i;

export function extractCaption(raw: string): { text: string; caption: string | undefined } {
  const match = raw.match(CAPTION_SECTION);
  if (!match) return { text: raw, caption: undefined };
  const caption = match[1]?.trim() || undefined;
  const text = raw.slice(0, match.index).trimEnd();
  return { text, caption };
}

export function extractTitle(text: string, slides: ParsedSlide[]): string {
  // 1. Explicit topic marker
  const match = text.match(/^\s*(?:thema|topic|titel|title)\s*[:–—-]\s*(.+)$/im);
  if (match?.[1]) return match[1].trim();

  // 2. Markdown heading at the top
  const heading = text.match(/^\s*#{1,3}\s*(.+)$/m);
  if (heading?.[1] && !/^(?:slide|folie)/i.test(heading[1].replace(/[*_#]/g, "").trim())) {
    return heading[1].replace(/^(?:Karussell|Carousel)\s*\d*[:–—-]?\s*/i, "").trim();
  }

  // 3. From Slide 1's extracted headline
  const slide1 = slides.find((s) => s.slideNumber === 1) ?? slides[0];
  if (slide1?.headline && slide1.headline !== slide1.title && !/^slide\s*\d+$/i.test(slide1.headline)) {
    return slide1.headline;
  }

  // 4. Intro text with quoted topic like: Da "10 Dinge" eine Liste ist...
  const quoteInIntro = text.match(/^[^\n]*["'“]([^"'”\n]{3,60})["'”]/m);
  if (quoteInIntro?.[1]) {
    return quoteInIntro[1].trim();
  }

  // 5. Fallback to Slide 1 title
  if (slide1?.title && !/^slide\s*\d+$/i.test(slide1.title)) {
    return slide1.title;
  }

  return "Unbenanntes Karussell";
}

export function parseBlock(text: string): ParsedCarousel[] {
  if (!text.trim()) return [];
  const chunks = text
    .split(CAROUSEL_SPLIT)
    .map((c) => c.trim())
    .filter(Boolean);

  return chunks
    .map((raw) => {
      // Strip trailing caption block BEFORE parsing slides so it is never
      // mistaken for a slide or appended to the last slide's prompt.
      const { text: cleanedRaw, caption } = extractCaption(raw);
      const slides = parseSlides(cleanedRaw);
      const explicit = /^\s*(?:thema|topic|titel|title)\s*[:–—-]/im.test(cleanedRaw);
      return {
        title: extractTitle(cleanedRaw, slides),
        titleFromBlock: explicit,
        raw: cleanedRaw,
        slides,
        ...(caption !== undefined && { caption }),
      } satisfies ParsedCarousel;
    })
    .filter((c) => c.slides.length > 0);
}
