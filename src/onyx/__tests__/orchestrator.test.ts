import { describe, it, expect, beforeEach } from "vitest";
import {
  enqueueJob,
  getJob,
  getIdempotencyRecord,
  listJobs,
  readStore,
  registerIdempotencyKey,
  updateJob,
  writeStore,
} from "../../mcp/store";
import { orchestrator } from "../../server/jobs/orchestrator";

describe("JobOrchestrator & Background Queue", () => {
  beforeEach(() => {
    const store = readStore();
    store.jobs = [];
    store.producedKeys = {};
    writeStore(store);
  });

  it("enqueues and updates jobs with attempts tracking", () => {
    const job = enqueueJob({
      type: "render",
      refId: "ref-123",
      status: "queued",
      maxAttempts: 3,
      payload: { test: true },
    });

    expect(job.id).toBeTruthy();
    expect(job.status).toBe("queued");
    expect(job.attempts).toBe(0);

    const retrieved = getJob(job.id);
    expect(retrieved?.id).toBe(job.id);

    const updated = updateJob(job.id, { status: "running", attempts: 1 });
    expect(updated?.status).toBe("running");
    expect(updated?.attempts).toBe(1);
  });

  it("filters jobs by status and type", () => {
    enqueueJob({ type: "render", refId: "1", status: "queued", maxAttempts: 3, payload: {} });
    enqueueJob({ type: "publish", refId: "2", status: "done", maxAttempts: 3, payload: {} });
    enqueueJob({ type: "render", refId: "3", status: "done", maxAttempts: 3, payload: {} });

    const queued = listJobs({ status: "queued" });
    expect(queued.length).toBe(1);
    expect(queued[0]?.refId).toBe("1");

    const renderJobs = listJobs({ type: "render" });
    expect(renderJobs.length).toBe(2);
  });

  it("manages idempotency records to prevent duplicate execution", () => {
    const key = "brief-hash-12345";
    expect(getIdempotencyRecord(key)).toBeUndefined();

    registerIdempotencyKey(key, "job-xyz");
    expect(getIdempotencyRecord(key)).toBe("job-xyz");
  });

  it("orchestrator enqueues jobs with idempotency key", () => {
    const job = orchestrator.enqueue({
      type: "render",
      refId: "series-456",
      idempotencyKey: "unique-key-999",
      payload: { autoPublish: false },
    });

    expect(job.id).toBeTruthy();
    expect(job.type).toBe("render");
    expect(job.idempotencyKey).toBe("unique-key-999");
  });
});
