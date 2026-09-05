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
