import JSZip from "jszip";
import type { SlideContent } from "./types";

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

export async function downloadSlide(slide: SlideContent) {
  if (!slide.imageUrl) return;
  const res = await fetch(slide.imageUrl);
  const blob = await res.blob();
  saveAs(blob, `Slide_${slide.slideNumber}_${safeName(slide.roleLabel)}.png`);
}

export async function exportCarouselAsZip(slides: SlideContent[], topic: string) {
  const withImages = slides.filter((s) => s.imageUrl);
  if (withImages.length === 0) return 0;

  const zip = new JSZip();
  let addedCount = 0;
  for (const slide of withImages) {
    if (!slide.imageUrl) continue;
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
        const res = await fetch(slide.imageUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        blob = await res.blob();
      }
      zip.file(`Slide_${String(slide.slideNumber).padStart(2, "0")}_${safeName(slide.roleLabel)}.png`, blob);
      addedCount++;
    } catch (err) {
      console.warn(`[exportCarouselAsZip] Slide ${slide.slideNumber} image fetch failed:`, err);
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

