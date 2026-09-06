import JSZip from "jszip";
import type { BrandKit, SlideContent } from "./types";

function saveAs(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function safeName(value: string) {
  return value.replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "") || "ONYX";
}

/**
 * Renders high-end Instagram typography, branding handle, accent highlights,
 * and contrast gradient overlays directly onto an image canvas (1080x1350 / 1080x1080).
 */
export async function renderSlideToCanvas(
  slide: SlideContent,
  brandKit?: BrandKit,
): Promise<Blob> {
  const isSquare = brandKit?.aspectRatio === "1:1";
  const width = 1080;
  const height = isSquare ? 1080 : 1350;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context nicht verfügbar");

  // 1. Draw base visual
  if (slide.imageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
        img.src = slide.imageUrl!;
      });
      const scale = Math.max(width / img.width, height / img.height);
      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    } catch {
      ctx.fillStyle = "#0D0B12";
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = "#0D0B12";
    ctx.fillRect(0, 0, width, height);
  }

  // 2. High-contrast gradient overlays for perfect text legibility
  const bottomGrad = ctx.createLinearGradient(0, height * 0.42, 0, height);
  bottomGrad.addColorStop(0, "rgba(5, 5, 8, 0)");
  bottomGrad.addColorStop(0.3, "rgba(5, 5, 8, 0.45)");
  bottomGrad.addColorStop(0.7, "rgba(5, 5, 8, 0.85)");
  bottomGrad.addColorStop(1, "rgba(5, 5, 8, 0.98)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, 0, width, height);

  const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.22);
  topGrad.addColorStop(0, "rgba(5, 5, 8, 0.75)");
  topGrad.addColorStop(1, "rgba(5, 5, 8, 0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, height);

  const accentColor = brandKit?.accentColorHex || "#FF4D17";
  const fontFamily = brandKit?.fontFamily ? `"${brandKit.fontFamily}", system-ui, sans-serif` : "system-ui, sans-serif";

  // 3. Top Section: Badge & Brand Handle
  const topPadding = 80;
  const sidePadding = 80;

  ctx.save();
  // Role / Progress Badge
  const badgeText = (slide.badge || `${String(slide.slideNumber).padStart(2, "0")} · ${slide.roleLabel}`).toUpperCase();
  ctx.font = `700 22px ${fontFamily}`;
  ctx.fillStyle = accentColor;
  ctx.fillText(badgeText, sidePadding, topPadding);

  // Handle (Top-Right)
  if (brandKit?.showHandle && brandKit.handle) {
    ctx.font = `600 22px ${fontFamily}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.textAlign = "right";
    ctx.fillText(brandKit.handle, width - sidePadding, topPadding);
  }
  ctx.restore();

  // 4. Headline & Subtext (Bottom Area)
  ctx.save();
  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const contentY = height - 320;

  if (slide.headline) {
    ctx.font = `800 48px ${fontFamily}`;
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;
    const headlineLines = wrapText(slide.headline, width - sidePadding * 2);
    let curY = contentY;
    for (const line of headlineLines.slice(0, 3)) {
      ctx.fillText(line, sidePadding, curY);
      curY += 58;
    }

    if (slide.subtext) {
      ctx.font = `400 26px ${fontFamily}`;
      ctx.fillStyle = "rgba(235, 235, 245, 0.9)";
      ctx.shadowBlur = 10;
      curY += 12;
      const subtextLines = wrapText(slide.subtext, width - sidePadding * 2);
      for (const line of subtextLines.slice(0, 3)) {
        ctx.fillText(line, sidePadding, curY);
        curY += 36;
      }
    }
  }

  // 5. Swipe Indicator / Closing CTA
  ctx.textAlign = "right";
  ctx.font = `700 24px ${fontFamily}`;
  ctx.fillStyle = accentColor;
  if (slide.role === "closing" && brandKit?.ctaText) {
    ctx.fillText(`${brandKit.ctaText} →`, width - sidePadding, height - 70);
  } else {
    ctx.fillText("Swipe →", width - sidePadding, height - 70);
  }
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

export async function downloadSlide(
  slide: SlideContent,
  brandKit?: BrandKit,
  withOverlay = false,
) {
  if (!slide.imageUrl) return;
  try {
    if (withOverlay && brandKit) {
      const blob = await renderSlideToCanvas(slide, brandKit);
      saveAs(blob, `Slide_${slide.slideNumber}_${safeName(slide.roleLabel)}_branded.png`);
      return;
    }
  } catch (err) {
    console.warn("Canvas-Overlay Download fehlgeschlagen, lade Original-Bild:", err);
  }

  const filename = `Slide_${slide.slideNumber}_${safeName(slide.roleLabel)}.png`;
  try {
    let blob: Blob;
    if (slide.imageUrl.startsWith("data:")) {
      const parts = slide.imageUrl.split(",");
      const mime = parts[0]?.match(/:(.*?);/)?.[1] || "image/png";
      const bstr = atob(parts[1] || "");
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      // Cloud URLs may block cross-origin fetch — route them through the proxy endpoint
      let fetchUrl = slide.imageUrl;
      let headers: Record<string, string> | undefined;
      try {
        const u = new URL(slide.imageUrl);
        const key = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
        if (key && (u.hostname.includes("s3") || u.hostname.includes("mega"))) {
          fetchUrl = `/api/cloud/file?key=${encodeURIComponent(key)}`;
          headers = getCloudHeaders();
        }
      } catch {
        // not a parseable URL — fetch as-is
      }
      const res = await fetch(fetchUrl, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      blob = await res.blob();
    }
    saveAs(blob, filename);
  } catch (err) {
    console.warn("Direkter Download fehlgeschlagen, öffne Bild in neuem Tab:", err);
    window.open(slide.imageUrl, "_blank", "noopener,noreferrer");
  }
}

export interface ExportZipOptions {
  brandKit?: BrandKit;
  withOverlay?: boolean;
}

export async function exportCarouselAsZip(
  slides: SlideContent[],
  topic: string,
  options?: ExportZipOptions,
) {
  const withImages = slides.filter((s) => s.imageUrl);
  if (withImages.length === 0) return 0;

  const zip = new JSZip();
  let addedCount = 0;
  const { brandKit, withOverlay = false } = options || {};

  for (const slide of withImages) {
    if (!slide.imageUrl) continue;
    try {
      let blob: Blob | null = null;

      if (withOverlay && brandKit) {
        try {
          blob = await renderSlideToCanvas(slide, brandKit);
        } catch (e) {
          console.warn(`[exportCarouselAsZip] Overlay fehlgeschlagen für Slide ${slide.slideNumber}, nutze Rohbild:`, e);
        }
      }

      if (!blob) {
        if (slide.imageUrl.startsWith("data:")) {
          const parts = slide.imageUrl.split(",");
          const mime = parts[0]?.match(/:(.*?);/)?.[1] || "image/png";
          const bstr = atob(parts[1] || "");
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          blob = new Blob([u8arr], { type: mime });
        } else {
          const res = await fetch(slide.imageUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          blob = await res.blob();
        }
      }

      const suffix = withOverlay ? "_branded" : "";
      zip.file(`Slide_${String(slide.slideNumber).padStart(2, "0")}_${safeName(slide.roleLabel)}${suffix}.png`, blob);
      addedCount++;
    } catch (err) {
      console.warn(`[exportCarouselAsZip] Slide ${slide.slideNumber} Bildabruf fehlgeschlagen:`, err);
    }
  }

  if (addedCount > 0) {
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${safeName(topic || "ONYX_Karussell")}.zip`);
    return addedCount;
  }

  return 0;
}

import { getCloudHeaders } from "./s4-storage";

export async function downloadCloudImage(image: { filename: string; displayUrl: string; proxyUrl?: string }) {
  try {
    const downloadUrl = image.proxyUrl || image.displayUrl;
    const res = await fetch(downloadUrl, {
      headers: image.proxyUrl ? getCloudHeaders() : undefined,
    });
    if (!res.ok) throw new Error("Fetch failed");
    const blob = await res.blob();
    saveAs(blob, image.filename || "bild.jpg");
  } catch {
    const a = document.createElement("a");
    a.href = image.displayUrl;
    a.download = image.filename || "bild.jpg";
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

export async function exportS4ImagesAsZip(
  images: { filename: string; displayUrl: string; proxyUrl?: string }[],
  folderName = "Mein_Cloud_Ordner",
) {
  if (images.length === 0) return 0;
  const zip = new JSZip();
  let addedCount = 0;

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    if (!item?.displayUrl) continue;
    try {
      const downloadUrl = item.proxyUrl || item.displayUrl;
      const res = await fetch(downloadUrl, {
        headers: item.proxyUrl ? getCloudHeaders() : undefined,
      });
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();
      zip.file(item.filename || `Bild_${i + 1}.jpg`, blob);
      addedCount++;
    } catch {
      // If direct cross-origin fetch is blocked, fetch as image or skip
    }
  }

  // Fallback: If cors prevented fetch, generate text index or notify
  if (addedCount > 0) {
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${safeName(folderName)}.zip`);
    return addedCount;
  }

  return 0;
}

