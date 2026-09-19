import { generateNanoBananaImage } from "../../onyx/kie-api";
import { ANCHORED_KIE_API_KEY } from "../../onyx/defaults";
import { getStore, saveStore, updateScheduledPost } from "../../mcp/store";
import type { Job, SeriesJob, SlideContent } from "../../onyx/types";

export interface RenderWorkerOptions {
  apiKey?: string;
  model?: "nano-banana-2" | "nano-banana-2-lite" | "nano-banana-pro" | "gpt-image-2-text-to-image";
}

/**
 * Worker that renders images for slides in a SeriesJob or ScheduledPost.
 */
export async function processRenderJob(
  job: Job,
  options?: RenderWorkerOptions
): Promise<{ success: boolean; error?: string; slidesRendered?: number }> {
  const store = getStore();
  const payload = job.payload as {
    seriesJobId?: string;
    postId?: string;
    apiKey?: string;
    model?: string;
    slides?: SlideContent[];
  };

  const apiKey = (options?.apiKey || payload.apiKey || ANCHORED_KIE_API_KEY).trim();
  if (!apiKey) {
    return {
      success: false,
      error: "Kein KIE.AI API-Key für das serverseitige Rendering verfügbar.",
    };
  }

  // Find linked series job if applicable
  const seriesJob = payload.seriesJobId
    ? store.seriesQueue.find((s) => s.id === payload.seriesJobId)
    : undefined;

  const slidesToRender: SlideContent[] =
    seriesJob?.slides || payload.slides || [];

  if (slidesToRender.length === 0) {
    return {
      success: false,
      error: "Keine Slides im Job-Payload zum Rendern gefunden.",
    };
  }

  let renderedCount = 0;

  for (let i = 0; i < slidesToRender.length; i++) {
    const slide = slidesToRender[i];
    if (!slide) continue;

    // Skip if already done
    if (slide.renderStatus === "done" && slide.imageUrl) {
      continue;
    }

    slide.renderStatus = "rendering";
    slide.renderProgress = 10;
    saveStore(store);

    try {
      const res = await generateNanoBananaImage({
        apiKey,
        prompt: slide.visualPrompt,
        aspectRatio: "4:5",
        resolution: "1K",
        model: (payload.model as any) || options?.model || "nano-banana-2",
        onProgress: (p) => {
          if (p.percent !== undefined) {
            slide.renderProgress = p.percent;
            saveStore(store);
          }
        },
      });

      slide.imageUrl = res.imageUrl;
      slide.renderStatus = "done";
      slide.renderProgress = 100;
      renderedCount++;

      if (seriesJob) {
        seriesJob.slidesDone = (seriesJob.slidesDone || 0) + 1;
      }
      saveStore(store);
    } catch (err: unknown) {
      slide.renderStatus = "error";
      slide.renderProgress = 0;
      saveStore(store);

      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Fehler beim Rendern von Slide ${slide.slideNumber}: ${errorMsg}`,
      };
    }
  }

  // If all slides are done, mark series job as done
  if (seriesJob) {
    const allDone = seriesJob.slides?.every((s) => s.renderStatus === "done" && s.imageUrl);
    if (allDone) {
      seriesJob.status = "done";
      saveStore(store);
    }
  }

  // If linked to a ScheduledPost, populate mediaUrls in order of slideNumber
  if (payload.postId) {
    const orderedUrls = [...slidesToRender]
      .sort((a, b) => a.slideNumber - b.slideNumber)
      .map((s) => s.imageUrl)
      .filter((url): url is string => Boolean(url));

    updateScheduledPost(payload.postId, {
      mediaUrls: orderedUrls,
      status: "scheduled",
    });
  }

  return {
    success: true,
    slidesRendered: renderedCount,
  };
}
