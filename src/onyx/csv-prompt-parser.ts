import type { ParsedCarousel, ParsedSlide } from "./types";
import { cleanPrompt, extractHeadlineAndSubtext, parseBlock } from "./parse-prompt-block";
import { sanitizeNoGedankenstriche } from "./caption-generator";

/**
 * Robust CSV Line Splitter supporting quoted values with commas/linebreaks
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;
  let i = 0;

  // Detect delimiter (semicolon vs comma vs tab)
  const firstLine = csvText.split(/\r?\n/)[0] || "";
  let delimiter = ",";
  if (firstLine.includes(";") && (firstLine.split(";").length > firstLine.split(",").length)) {
    delimiter = ";";
  } else if (firstLine.includes("\t") && (firstLine.split("\t").length > firstLine.split(",").length)) {
    delimiter = "\t";
  }

  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i += 2;
        continue;
      } else if (char === '"') {
        inQuotes = false;
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = "";
        i++;
        continue;
      } else if (char === "\r" && nextChar === "\n") {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
        i += 2;
        continue;
      } else if (char === "\n" || char === "\r") {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

/**
 * Converts Markdown Tables (often exported by ChatGPT/Claude) into CSV matrix
 */
export function parseMarkdownTable(markdown: string): string[][] {
  const lines = markdown.split(/\r?\n/).filter((l) => l.includes("|"));
  if (lines.length < 2) return [];

  const rows: string[][] = [];
  for (const line of lines) {
    // Skip separator lines like |---|---|---|
    if (/^\s*\|?\s*[-:]+[-| :]+\s*\|?\s*$/.test(line)) continue;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, idx, arr) => {
        // Drop leading/trailing empty cells from border pipes
        if (idx === 0 && line.trim().startsWith("|")) return false;
        if (idx === arr.length - 1 && line.trim().endsWith("|")) return false;
        return true;
      });

    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return rows;
}

/**
 * Universal Intelligent Prompt & CSV Parser for ChatGPT, Claude, and Gemini exports.
 */
export function parseUniversalPromptFile(fileContent: string, fileName = ""): ParsedCarousel[] {
  const trimmed = fileContent.trim();
  if (!trimmed) return [];

  // Case 1: JSON File
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsedJson = JSON.parse(trimmed);
      if (Array.isArray(parsedJson)) {
        // Is it array of carousels or array of slides?
        if (parsedJson[0]?.slides && Array.isArray(parsedJson[0].slides)) {
          return parsedJson.map((c, i) => ({
            title: String(c.title || c.topic || `Karussell ${i + 1}`),
            titleFromBlock: true,
            raw: JSON.stringify(c),
            slides: (c.slides as Array<Record<string, unknown>>).map((s, si) => ({
              slideNumber: Number(s['slideNumber'] || si + 1),
              title: String(s['title'] || `Slide ${si + 1}`),
              headline: String(s['headline'] || s['title'] || `Slide ${si + 1}`),
              subtext: String(s['subtext'] || ""),
              prompt: cleanPrompt(String(s['visualPrompt'] || s['prompt'] || "")),
            })),
            caption: c.caption ? sanitizeNoGedankenstriche(String(c.caption)) : undefined,
          }));
        }
      }
    } catch {
      // Fall through to other formats
    }
  }

  // Case 2: Markdown Table from ChatGPT or Claude (e.g. "| Slide | Headline | Prompt |")
  if (trimmed.includes("|") && trimmed.includes("---")) {
    const mdRows = parseMarkdownTable(trimmed);
    if (mdRows.length >= 2) {
      const carousels = parseTableRowsToCarousels(mdRows, fileName);
      if (carousels.length > 0) return carousels;
    }
  }

  // Case 3: CSV / TSV data
  const isCsvLike = fileName.endsWith(".csv") || fileName.endsWith(".tsv") || trimmed.includes(";") || (trimmed.includes(",") && trimmed.split("\n")[0]?.includes(","));
  if (isCsvLike) {
    const csvRows = parseCsvRows(trimmed);
    if (csvRows.length >= 2) {
      const carousels = parseTableRowsToCarousels(csvRows, fileName);
      if (carousels.length > 0) return carousels;
    }
  }

  // Case 4: Standard Claude / ChatGPT Text Block (with === or Slide 1 / Folie 1 headers)
  return parseBlock(trimmed);
}

/**
 * Maps 2D table rows (from CSV or Markdown) to structured Carousels
 */
function parseTableRowsToCarousels(rows: string[][], fallbackTitle = ""): ParsedCarousel[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const dataRows = rows.slice(1);

  // Identify column indices
  const topicIdx = headers.findIndex((h) => /^(thema|topic|carousel|karussell|title|titel|post|beitrag)/i.test(h));
  const slideNumIdx = headers.findIndex((h) => /^(slide|folie|nummer|number|slide_num|step)/i.test(h));
  const headlineIdx = headers.findIndex((h) => /^(headline|überschrift|hook|titel_slide|header)/i.test(h));
  const subtextIdx = headers.findIndex((h) => /^(subtext|untertitel|text|body|inhalt|description)/i.test(h));
  const promptIdx = headers.findIndex((h) => /^(prompt|visual_prompt|bild_prompt|image_prompt|visual|bild)/i.test(h));
  const captionIdx = headers.findIndex((h) => /^(caption|post_caption|beitragstext|text_post|copy)/i.test(h));

  // Determine if rows are grouped by Carousel/Topic
  const carouselsMap = new Map<string, { topic: string; slides: ParsedSlide[]; caption?: string }>();
  let currentTopic = fallbackTitle.replace(/\.[^/.]+$/, "") || "Importiertes Karussell";

  dataRows.forEach((row, rowIdx) => {
    const rawTopic = topicIdx !== -1 && row[topicIdx] ? row[topicIdx].trim() : "";
    if (rawTopic) {
      currentTopic = rawTopic;
    }

    if (!carouselsMap.has(currentTopic)) {
      carouselsMap.set(currentTopic, { topic: currentTopic, slides: [] });
    }
    const currentCarousel = carouselsMap.get(currentTopic)!;

    // Extract slide data
    const rawSlideNum = slideNumIdx !== -1 ? parseInt(row[slideNumIdx].replace(/\D/g, ""), 10) : NaN;
    const slideNumber = !isNaN(rawSlideNum) ? rawSlideNum : currentCarousel.slides.length + 1;

    let prompt = promptIdx !== -1 && row[promptIdx] ? cleanPrompt(row[promptIdx]) : "";
    let headline = headlineIdx !== -1 && row[headlineIdx] ? row[headlineIdx].trim() : "";
    let subtext = subtextIdx !== -1 && row[subtextIdx] ? row[subtextIdx].trim() : "";

    // If prompt is missing but we have headline, create visual prompt from headline
    if (!prompt && headline) {
      prompt = `Cinematic high-contrast studio aesthetic, bold visual composition, clean background: ${headline}`;
    } else if (prompt && (!headline || !subtext)) {
      const extracted = extractHeadlineAndSubtext(prompt);
      if (!headline) headline = extracted.headline;
      if (!subtext) subtext = extracted.subtext;
    }

    if (!headline) {
      headline = `Slide ${slideNumber}`;
    }

    // Extract caption if present in row
    if (captionIdx !== -1 && row[captionIdx] && !currentCarousel.caption) {
      currentCarousel.caption = sanitizeNoGedankenstriche(row[captionIdx]);
    }

    currentCarousel.slides.push({
      slideNumber,
      title: `Slide ${slideNumber}`,
      headline,
      subtext,
      prompt: prompt || headline,
    });
  });

  const result: ParsedCarousel[] = [];
  carouselsMap.forEach((val) => {
    if (val.slides.length > 0) {
      result.push({
        title: val.topic,
        titleFromBlock: true,
        raw: val.slides.map((s) => `Slide ${s.slideNumber}: ${s.headline}\n${s.prompt}`).join("\n\n"),
        slides: val.slides.sort((a, b) => a.slideNumber - b.slideNumber),
        caption: val.caption,
      });
    }
  });

  return result;
}
