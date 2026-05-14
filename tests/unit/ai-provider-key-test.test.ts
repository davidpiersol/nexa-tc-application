import { describe, expect, it, vi } from "vitest";
import { testSavedAiProviderKey } from "@/lib/ai/provider-key-test";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}

describe("AI provider key test", () => {
  it("rejects missing saved keys before calling a provider", async () => {
    const fetchImpl = vi.fn();
    const result = await testSavedAiProviderKey("ai_xai_grok", null, fetchImpl as any);

    expect(result.ok).toBe(false);
    expect(result.message).toContain("No saved API key");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("validates xAI Grok with the OpenAI-compatible models endpoint", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: [{ id: "grok-test" }] }));
    const result = await testSavedAiProviderKey(
      "ai_xai_grok",
      { apiKey: "xai-test-key" },
      fetchImpl as any,
    );

    expect(result.ok).toBe(true);
    expect(result.modelCount).toBe(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.x.ai/v1/models",
      expect.objectContaining({
        headers: { Authorization: "Bearer xai-test-key" },
      }),
    );
  });

  it("reports provider rejections without exposing the key", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: "bad key" }, { status: 401 }));
    const result = await testSavedAiProviderKey(
      "ai_openai",
      { apiKey: "secret-key" },
      fetchImpl as any,
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("rejected");
    expect(JSON.stringify(result)).not.toContain("secret-key");
  });
});
