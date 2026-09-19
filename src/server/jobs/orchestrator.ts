import { enqueueJob, getJob, listJobs, updateJob } from "../../mcp/store";
import type { Job, JobQueueStatus, JobType } from "../../onyx/types";
import { processRenderJob } from "./render-worker";
import { processPublishJob } from "./publish-worker";

export interface JobHandlerResult {
  success: boolean;
  error?: string;
  externalId?: string;
}

export class JobOrchestrator {
  private isProcessing = false;
  private tickerInterval: NodeJS.Timeout | null = null;

  /**
   * Enqueues a new background job with deduplication and idempotency support.
   */
  enqueue(params: {
    type: JobType;
    refId: string;
    payload: Record<string, unknown>;
    maxAttempts?: number;
    idempotencyKey?: string;
  }): Job {
    return enqueueJob({
      type: params.type,
      refId: params.refId,
      status: "queued",
      maxAttempts: params.maxAttempts ?? 3,
      idempotencyKey: params.idempotencyKey,
      payload: params.payload,
    });
  }

  /**
   * Executes a single job by ID.
   */
  async executeJob(jobId: string): Promise<JobHandlerResult> {
    const job = getJob(jobId);
    if (!job) {
      return { success: false, error: `Job ${jobId} nicht gefunden.` };
    }

    if (job.status === "running" || job.status === "done") {
      return { success: true };
    }

    const currentAttempts = (job.attempts || 0) + 1;
    updateJob(jobId, {
      status: "running",
      attempts: currentAttempts,
    });

    let result: JobHandlerResult;

    try {
      if (job.type === "render") {
        result = await processRenderJob(job);
      } else if (job.type === "publish") {
        result = await processPublishJob(job);
      } else {
        result = { success: true };
      }
    } catch (err: unknown) {
      result = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    if (result.success) {
      updateJob(jobId, {
        status: "done",
        lastError: undefined,
      });

      // Pipeline chaining: if render finishes and autoPublish is set, enqueue publish job
      if (job.type === "render" && job.payload["autoPublish"] && job.payload["postId"]) {
        this.enqueue({
          type: "publish",
          refId: String(job.payload["postId"]),
          payload: {
            postId: String(job.payload["postId"]),
            apiKey: job.payload["postForMeApiKey"],
          },
        });
      }
    } else {
      const isDead = currentAttempts >= job.maxAttempts;
      updateJob(jobId, {
        status: isDead ? "dead" : "queued",
        lastError: result.error,
      });
    }

    return result;
  }

  /**
   * Processes all currently queued jobs.
   */
  async tick(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    try {
      const pending = listJobs({ status: "queued" });
      let processed = 0;

      for (const job of pending) {
        await this.executeJob(job.id);
        processed++;
      }

      return processed;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Starts a background interval ticker.
   */
  startTicker(intervalMs = 3000): void {
    if (this.tickerInterval) return;
    this.tickerInterval = setInterval(() => {
      void this.tick();
    }, intervalMs);
  }

  /**
   * Stops the background interval ticker.
   */
  stopTicker(): void {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
  }
}

// Global orchestrator singleton instance
export const orchestrator = new JobOrchestrator();
