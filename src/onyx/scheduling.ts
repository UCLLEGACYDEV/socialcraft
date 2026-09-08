/**
 * Shared posting-schedule helpers used by the composer scheduler and the
 * 30-day batch. Kept framework-free so both can import it.
 */

export interface PostingSlotConfig {
  /** Weekdays that get posts, 0 = Sunday … 6 = Saturday. */
  days: number[];
  /** Times of day in "HH:MM" (local), earliest first. */
  times: string[];
}

export const DEFAULT_POSTING_SLOTS: PostingSlotConfig = {
  days: [1, 2, 3, 4, 5],
  times: ["09:00", "13:00", "18:00"],
};

/**
 * Returns the next `count` posting datetimes that match the slot config, start at
 * least ~15 min from now, and don't collide (±5 min) with an already-taken time.
 */
export function computeNextSlots(
  config: PostingSlotConfig,
  count: number,
  taken: number[]
): Date[] {
  const days = config.days.length ? config.days : DEFAULT_POSTING_SLOTS.days;
  const times = (config.times.length ? config.times : DEFAULT_POSTING_SLOTS.times)
    .map((t) => t.split(":").map(Number))
    .filter(([h, m]) => Number.isFinite(h) && Number.isFinite(m))
    .sort((a, b) => a[0] * 60 + a[1] - (b[0] * 60 + b[1]));

  const out: Date[] = [];
  const min = Date.now() + 15 * 60 * 1000;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 400 && out.length < count; dayOffset++) {
    const day = new Date(cursor);
    day.setDate(day.getDate() + dayOffset);
    if (!days.includes(day.getDay())) continue;
    for (const [h, m] of times) {
      if (out.length >= count) break;
      const slot = new Date(day);
      slot.setHours(h, m, 0, 0);
      const ts = slot.getTime();
      if (ts < min) continue;
      const clash =
        taken.some((t) => Math.abs(t - ts) < 5 * 60 * 1000) ||
        out.some((d) => Math.abs(d.getTime() - ts) < 5 * 60 * 1000);
      if (clash) continue;
      out.push(slot);
    }
  }
  return out;
}

/**
 * Renders a clean branded quote/statement card as a JPEG data URL (client-side,
 * no network). Used so batch-generated posts always have a usable visual.
 */
export function renderQuoteCard(
  text: string,
  opts: { accent?: string; kicker?: string; handle?: string } = {}
): string {
  if (typeof document === "undefined") return "";
  const W = 1080;
  const H = 1350;
  const accent = opts.accent || "#FF4D17";
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#141017");
  bg.addColorStop(1, "#0A0710");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Accent glow top-left
  const glow = ctx.createRadialGradient(160, 160, 0, 160, 160, 700);
  glow.addColorStop(0, hexToRgba(accent, 0.28));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Accent bar
  ctx.fillStyle = accent;
  ctx.fillRect(100, 240, 96, 8);

  // Kicker
  if (opts.kicker) {
    ctx.fillStyle = hexToRgba(accent, 0.9);
    ctx.font = "700 30px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(opts.kicker.toUpperCase(), 100, 210);
  }

  // Headline — wrapped, auto-sized
  const clean = text.replace(/\s+/g, " ").trim();
  let fontSize = 82;
  const maxWidth = W - 200;
  const maxHeight = 760;
  let lines: string[] = [];
  for (; fontSize >= 40; fontSize -= 4) {
    ctx.font = `800 ${fontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    lines = wrapText(ctx, clean, maxWidth);
    if (lines.length * fontSize * 1.25 <= maxHeight) break;
  }
  ctx.fillStyle = "#F7F4F2";
  ctx.font = `800 ${fontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  let y = 340 + fontSize;
  for (const line of lines) {
    ctx.fillText(line, 100, y);
    y += fontSize * 1.25;
  }

  // Handle / footer
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 28px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText(opts.handle || "socialcraft", 100, H - 90);

  return canvas.toDataURL("image/jpeg", 0.9);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
