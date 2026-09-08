import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleCloudApiRequest } from "../../server/cloud-api-router";

describe("Server AI Proxy (/api/cloud/ai/*)", () => {
  const originalFetch = globalThis.fetch;
  const originalEnvKie = process.env["KIE_API_KEY"];
  const originalEnvViteKie = process.env["VITE_KIE_API_KEY"];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalEnvKie !== undefined) process.env["KIE_API_KEY"] = originalEnvKie;
    else delete process.env["KIE_API_KEY"];
    if (originalEnvViteKie !== undefined) process.env["VITE_KIE_API_KEY"] = originalEnvViteKie;
    else delete process.env["VITE_KIE_API_KEY"];
  });

  it("returns 401 when no API key is provided and no server environment key is set", async () => {
    delete process.env["KIE_API_KEY"];
    delete process.env["VITE_KIE_API_KEY"];

    const req = new Request("http://localhost:8080/api/cloud/ai/credit", {
      method: "GET",
    });

    const res = await handleCloudApiRequest(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(401);
    const body = (await res?.json()) as { code: number; msg: string };
    expect(body.code).toBe(401);
  });

  it("proxies credit check to upstream KIE.AI using server environment key if no client key is passed", async () => {
    process.env["KIE_API_KEY"] = "server_secret_key_456";

    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ code: 200, msg: "success", data: 1200 }),
    } as unknown as Response);

    const req = new Request("http://localhost:8080/api/cloud/ai/credit", {
      method: "GET",
    });

    const res = await handleCloudApiRequest(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    const body = (await res?.json()) as { code: number; data: number };
    expect(body.data).toBe(1200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.kie.ai/api/v1/chat/credit",
      expect.objectContaining({
        headers: { Authorization: "Bearer server_secret_key_456" },
      }),
    );
  });

  it("proxies credit check to upstream KIE.AI with client provided key header override", async () => {
    delete process.env["KIE_API_KEY"];
    delete process.env["VITE_KIE_API_KEY"];

    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ code: 200, msg: "success", data: 850 }),
    } as unknown as Response);

    const req = new Request("http://localhost:8080/api/cloud/ai/credit", {
      method: "GET",
      headers: {
        "x-kie-api-key": "test_key_123",
      },
    });

    const res = await handleCloudApiRequest(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    const body = (await res?.json()) as { code: number; data: number };
    expect(body.code).toBe(200);
    expect(body.data).toBe(850);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.kie.ai/api/v1/chat/credit",
      expect.objectContaining({
        headers: { Authorization: "Bearer test_key_123" },
      }),
    );
  });

  it("proxies task creation and scrubs apiKey from forwarded payload", async () => {
    delete process.env["KIE_API_KEY"];
    delete process.env["VITE_KIE_API_KEY"];

    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ code: 200, msg: "success", data: { taskId: "task_abc_456" } }),
    } as unknown as Response);

    const req = new Request("http://localhost:8080/api/cloud/ai/create-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: "custom_key_xyz",
        model: "nano-banana-2",
        input: { prompt: "A sleek modern car" },
      }),
    });

    const res = await handleCloudApiRequest(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    const body = (await res?.json()) as { code: number; data: { taskId: string } };
    expect(body.data.taskId).toBe("task_abc_456");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.kie.ai/api/v1/jobs/createTask",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer custom_key_xyz",
          "Content-Type": "application/json",
        },
      }),
    );
  });
});
