import type {
  IImageProvider,
  ImageTaskRequest,
  ImageTaskResult,
} from "./types";
import { config } from "../../lib/config";

function resolveKieKey(customKey?: string): string {
  if (customKey && customKey.trim().length > 5) return customKey.trim();
  if (typeof process !== "undefined" && process.env) {
    const envKey = process.env["KIE_API_KEY"] || process.env["VITE_KIE_API_KEY"];
    if (envKey && envKey.trim().length > 5) return envKey.trim();
  }
  return config.api.kieApiKey || "";
}

export class KieImageProvider implements IImageProvider {
  name = "kie-nano-banana";

  async createTask(params: ImageTaskRequest): Promise<{ taskId: string }> {
    const key = resolveKieKey(params.apiKey);
    if (!key) {
      throw new Error("KIE.AI API-Key nicht konfiguriert.");
    }

    const payload: Record<string, unknown> = {
      prompt: params.prompt,
      model: "nano-banana-2",
      aspect_ratio: params.aspectRatio || "4:5",
      resolution: "2K",
    };

    if (params.referenceImages && params.referenceImages.length > 0) {
      payload["input_images"] = params.referenceImages;
    }

    const resp = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`KIE.AI Task Creation fehlgeschlagen (${resp.status}): ${errText}`);
    }

    const data = (await resp.json()) as { data?: { taskId?: string }; taskId?: string };
    const taskId = data.data?.taskId || data.taskId;
    if (!taskId) {
      throw new Error("KIE.AI hat keine taskId zurückgegeben.");
    }

    return { taskId };
  }

  async getTaskStatus(taskId: string, apiKey?: string): Promise<ImageTaskResult> {
    const key = resolveKieKey(apiKey);
    const resp = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers: key ? { Authorization: `Bearer ${key}` } : {},
      }
    );

    if (!resp.ok) {
      return { taskId, status: "FAILED", error: `HTTP ${resp.status}` };
    }

    const json = (await resp.json()) as {
      code?: number;
      data?: {
        state?: string;
        progress?: number;
        result?: { imageUrl?: string; image_url?: string; images?: string[] };
      };
    };

    const state = (json.data?.state || "").toUpperCase();
    const progress = json.data?.progress ?? (state === "SUCCESS" ? 100 : 25);
    const imageUrl =
      json.data?.result?.imageUrl ||
      json.data?.result?.image_url ||
      json.data?.result?.images?.[0];

    if (state === "SUCCESS" && imageUrl) {
      return { taskId, status: "SUCCESS", imageUrl, progress: 100 };
    }
    if (state === "FAILED" || state === "ERROR") {
      return { taskId, status: "FAILED", progress: 0, error: "Task fehlgeschlagen" };
    }

    return { taskId, status: "RUNNING", progress };
  }
}

export const defaultImageProvider = new KieImageProvider();
