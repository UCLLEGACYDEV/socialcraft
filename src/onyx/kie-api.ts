/**
 * KIE.AI — Universal API Integration
 *
 * Supported Models:
 *   - nano-banana-2           (photorealistic, fast)
 *   - nano-banana-2-lite      (photorealistic, lite)
 *   - nano-banana-pro         (high quality)
 *   - gpt-image-2-text-to-image (OpenAI GPT-Image-2 via KIE.AI)
 *
 * Official Endpoints:
 * - Credits:      GET  https://api.kie.ai/api/v1/chat/credit
 * - Create Task:  POST https://api.kie.ai/api/v1/jobs/createTask
 * - Query Status: GET  https://api.kie.ai/api/v1/jobs/recordInfo?taskId={id}
 */

import type { CreditBalanceInfo } from "./types";

export interface KieCreditResult extends CreditBalanceInfo {
  error?: string;
  code?: number;
}

export type KieModel =
  | "nano-banana-2"
  | "nano-banana-2-lite"
  | "nano-banana-pro"
  | "gpt-image-2-text-to-image";

/** Nano-Banana specific size (aspect ratio mapped to pixel size) */
export type NanoBananaAspectRatio =
  | "1:1" | "2:3" | "3:2" | "1:4" | "4:1" | "3:4" | "4:3" | "4:5" | "5:4"
  | "1:8" | "8:1" | "9:16" | "16:9" | "21:9" | "auto";

/** GPT-Image-2 specific size options */
export type GptImage2Size = "1024x1024" | "1024x1536" | "1536x1024";
export type GptImage2Quality = "standard" | "hd";
export type GptImage2Style = "vivid" | "natural";

export interface NanoBananaTaskParams {
  model?: KieModel | undefined;
  apiKey: string;
  prompt: string;
  imageInput?: string[] | undefined;
  aspectRatio?: NanoBananaAspectRatio | undefined;
  resolution?: "1K" | "2K" | "4K" | undefined;
  outputFormat?: "jpg" | "png" | undefined;
  // GPT-Image-2 specific
  gptSize?: GptImage2Size | undefined;
  gptQuality?: GptImage2Quality | undefined;
  gptStyle?: GptImage2Style | undefined;
  gptN?: number | undefined;
  callBackUrl?: string | undefined;
  signal?: AbortSignal | undefined;
}

export interface CreateTaskResponse {
  code: number;
  msg: string;
  data?: {
    taskId: string;
  };
}

export interface RecordInfoResponse {
  code: number;
  msg: string;
  data?: {
    taskId: string;
    model: string;
    state: "waiting" | "success" | "fail";
    param?: string;
    resultJson?: string;
    failCode?: string | null;
    failMsg?: string | null;
    costTime?: number | null;
    completeTime?: number | null;
    createTime?: number | null;
  };
}

export interface NanoBananaGenerateResult {
  success: boolean;
  imageUrl: string;
  taskId?: string;
  costTime?: number;
  provider: "kie-ai";
  fromRealApi: boolean;
}

const KIE_BASE_URL = "https://api.kie.ai/api/v1";

/**
 * 1. Fetch live credit balance from KIE.AI
 * GET https://api.kie.ai/api/v1/chat/credit
 */
export async function fetchKieCredits(apiKey: string): Promise<KieCreditResult> {
  const cleanKey = apiKey?.trim();
  if (!cleanKey) {
    return {
      credits: 0,
      formatted: "Kein Key",
      success: false,
      error: "Kein Master API-Key hinterlegt",
    };
  }

  try {
    const response = await fetch(`${KIE_BASE_URL}/chat/credit`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cleanKey}`,
      },
    });

    const json = (await response.json()) as { code: number; msg: string; data?: number | string };

    if (json.code === 200 && json.data !== undefined) {
      const credits = typeof json.data === "number" ? json.data : Number.parseInt(String(json.data), 10) || 0;
      return {
        credits,
        formatted: `${credits.toLocaleString("de-DE")} cr`,
        success: true,
        code: 200,
      };
    }

    if (json.code === 401) {
      return {
        credits: 0,
        formatted: "Ungültiger Key",
        success: false,
        error: "API-Key ungültig oder abgelaufen (401)",
        code: 401,
      };
    }

    if (json.code === 402) {
      return {
        credits: 0,
        formatted: "0 cr (Aufgebraucht)",
        success: false,
        error: "Guthaben aufgebraucht (402)",
        code: 402,
      };
    }

    return {
      credits: 0,
      formatted: "Fehler",
      success: false,
      error: json.msg || `Server-Code ${json.code}`,
      code: json.code,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Netzwerkfehler beim Abruf der Engine-Credits";
    return {
      credits: 0,
      formatted: "Offline / Fehler",
      success: false,
      error: errMsg,
    };
  }
}

/**
 * 2. Create Generation Task on Engine
 */
export async function createNanoBananaTask(params: NanoBananaTaskParams): Promise<string> {
  const cleanKey = params.apiKey?.trim();
  if (!cleanKey) {
    throw new Error("API-Key fehlt. Bitte im Admin-Bereich hinterlegen.");
  }

  const model = params.model || "nano-banana-2";
  const isGptImage2 = model === "gpt-image-2-text-to-image";

  let inputPayload: Record<string, unknown>;

  if (isGptImage2) {
    // GPT Image 2 uses size/quality/style instead of aspect_ratio/resolution
    const aspectRatio = params.aspectRatio || "4:5";
    // Map aspect ratio to GPT Image 2 sizes
    let gptSize: GptImage2Size = "1024x1536"; // default portrait (4:5)
    if (aspectRatio === "1:1") gptSize = "1024x1024";
    else if (aspectRatio === "16:9" || aspectRatio === "3:2" || aspectRatio === "4:3") gptSize = "1536x1024";
    else gptSize = params.gptSize || "1024x1536";

    inputPayload = {
      prompt: params.prompt,
      size: gptSize,
      quality: params.gptQuality || "standard",
      style: params.gptStyle || "vivid",
      n: params.gptN || 1,
    };
  } else {
    // Nano-Banana models: aspect_ratio + resolution
    inputPayload = {
      prompt: params.prompt,
      ...(params.imageInput && params.imageInput.length > 0 ? { image_input: params.imageInput } : {}),
      aspect_ratio: params.aspectRatio || "4:5",
      resolution: params.resolution || "1K",
      output_format: params.outputFormat || "jpg",
    };
  }

  const payload = {
    model,
    input: inputPayload,
    ...(params.callBackUrl ? { callBackUrl: params.callBackUrl } : {}),
  };

  const response = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cleanKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: params.signal ?? null,
  });

  const json = (await response.json()) as CreateTaskResponse;

  if (json.code !== 200 || !json.data?.taskId) {
    if (json.code === 401) {
      throw new Error("Fehler 401: Engine-Authentifizierung fehlgeschlagen.");
    }
    if (json.code === 402) {
      throw new Error("Fehler 402: Zentrales Engine-Kontingent aufgebraucht.");
    }
    throw new Error(json.msg || `Task-Erstellung fehlgeschlagen (Code: ${json.code})`);
  }

  return json.data.taskId;
}

export interface KieProgressInfo {
  state: string;
  message: string;
  percent?: number | undefined;
  costTime?: number | undefined;
}

/**
 * 3. Poll Task Status until completion
 * GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={id}
 */
export async function pollNanoBananaTask(
  taskId: string,
  apiKey: string,
  signal?: AbortSignal,
  onProgress?: (info: KieProgressInfo) => void,
): Promise<{ imageUrl: string; costTime?: number }> {
  const cleanKey = apiKey.trim();
  const maxAttempts = 50; // up to ~100s timeout
  const pollIntervalMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new DOMException("Generierung durch Benutzer abgebrochen", "AbortError");
    }

    const response = await fetch(`${KIE_BASE_URL}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cleanKey}`,
      },
      signal: signal ?? null,
    });

    const json = (await response.json()) as RecordInfoResponse;

    if (json.code !== 200 || !json.data) {
      throw new Error(json.msg || `Fehler bei Statusabfrage (Code ${json.code})`);
    }

    const data = json.data;

    if (data.state === "success") {
      const resolvedCostTime = data.costTime != null ? data.costTime : undefined;
      onProgress?.({
        state: "success",
        message: "Fertig gerendert!",
        percent: 100,
        ...(resolvedCostTime !== undefined ? { costTime: resolvedCostTime } : {}),
      });

      if (!data.resultJson) {
        throw new Error("Render-Server meldete Erfolg, lieferte aber keine Bilddaten");
      }

      try {
        const parsed = JSON.parse(data.resultJson) as { resultUrls?: string[] };
        const firstUrl = parsed.resultUrls?.[0];
        if (!firstUrl) {
          throw new Error("Keine Bild-URL im Ergebnis gefunden");
        }
        return {
          imageUrl: firstUrl,
          ...(data.costTime != null ? { costTime: data.costTime } : {}),
        };
      } catch (err: unknown) {
        if (err instanceof Error) throw err;
        throw new Error("Fehler beim Verarbeiten der Bilddaten");
      }
    }

    if (data.state === "fail") {
      throw new Error(data.failMsg || `Render fehlgeschlagen (Code: ${data.failCode || "unbekannt"})`);
    }

    // state === "waiting" - calculate smooth percentage between 20% and 95%
    const percent = Math.min(95, Math.round(20 + ((attempt + 1) / 25) * 75));
    onProgress?.({
      state: "waiting",
      message: `ONYX Engine rendert… (Schritt ${attempt + 1})`,
      percent,
    });

    // Wait before next poll
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, pollIntervalMs);
      if (signal) {
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timeout);
            reject(new DOMException("Abgebrochen", "AbortError"));
          },
          { once: true },
        );
      }
    });
  }

  throw new Error(`Zeitüberschreitung beim Rendern (Timeout nach 100s)`);
}

/**
 * 4. High-Level Function: Generates image via Nano-Banana 2
 */
export async function generateNanoBananaImage(
  params: NanoBananaTaskParams & {
    onProgress?: (info: KieProgressInfo) => void;
  },
): Promise<NanoBananaGenerateResult> {
  const model = params.model || "nano-banana-2";
  params.onProgress?.({ state: "init", message: "Initialisiere ONYX Ultra Pipeline…", percent: 5 });

  // 1. Create task (model-aware)
  const taskId = await createNanoBananaTask(params);
  params.onProgress?.({ state: "created", message: "Slide wird gerendert…", percent: 18 });

  // 2. Poll result
  const { imageUrl, costTime } = await pollNanoBananaTask(taskId, params.apiKey, params.signal, params.onProgress);

  return {
    success: true,
    imageUrl,
    taskId,
    ...(costTime !== undefined ? { costTime } : {}),
    provider: "kie-ai",
    fromRealApi: true,
  };
}
