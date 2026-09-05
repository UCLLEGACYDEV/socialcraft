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
  for (const slide of withImages) {
    const res = await fetch(slide.imageUrl as string);
    const blob = await res.blob();
    zip.file(`Slide_${String(slide.slideNumber).padStart(2, "0")}_${safeName(slide.roleLabel)}.png`, blob);
  }
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${safeName(topic || "ONYX_Karussell")}.zip`);
  return withImages.length;
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

