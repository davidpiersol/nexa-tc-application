import { beforeEach, describe, expect, it, vi } from "vitest";

const requireGlobalAdmin = vi.fn();
const listGlobalCredentialStatuses = vi.fn();
const upsertGlobalCredentials = vi.fn();
const getGlobalCredentials = vi.fn();
const auditInsert = vi.fn(async () => ({ error: null }));
const testSavedAiProviderKey = vi.fn();

vi.mock("@/lib/auth/admin-guard", () => ({
  requireGlobalAdmin,
}));

vi.mock("@/lib/security/enforce-rate-limit", () => ({
  enforceApiRateLimit: vi.fn(async () => null),
}));

vi.mock("@/lib/security/csrf-server", () => ({
  validateCsrf: vi.fn(async () => true),
}));

vi.mock("@/lib/integrations/global-credentials-store", () => ({
  getGlobalCredentials,
  listGlobalCredentialStatuses,
  upsertGlobalCredentials,
}));

vi.mock("@/lib/ai/provider-key-test", () => ({
  testSavedAiProviderKey,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: () => ({
    from: () => ({
      insert: auditInsert,
    }),
  }),
}));

describe("global AI credentials API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireGlobalAdmin.mockResolvedValue({
      actor: { userId: "user-1", tenantId: "tenant-1", role: "global_admin" },
      error: null,
    });
    listGlobalCredentialStatuses.mockResolvedValue([
      {
        provider: "ai_xai_grok",
        configured: true,
        settings: {},
        updatedAt: "2026-05-14T00:00:00.000Z",
      },
    ]);
    upsertGlobalCredentials.mockResolvedValue(undefined);
    getGlobalCredentials.mockResolvedValue({ apiKey: "xai-test-key" });
    testSavedAiProviderKey.mockResolvedValue({
      ok: true,
      provider: "ai_xai_grok",
      checkedAt: "2026-05-14T00:00:00.000Z",
      status: 200,
      modelCount: 2,
      message: "Key validated. Provider returned 2 models.",
    });
  });

  it("returns masked credential status without secret values", async () => {
    const { GET } = await import("@/app/api/admin/global/ai/credentials/route");
    const response = await GET(
      new Request("http://localhost/api/admin/global/ai/credentials") as any,
    );
    const body = (await response.json()) as { items: Array<Record<string, unknown>> };

    expect(response.status).toBe(200);
    expect(body.items[0]).toMatchObject({ provider: "ai_xai_grok", configured: true });
    expect(JSON.stringify(body)).not.toContain("apiKey");
  });

  it("saves a supported provider credential through encrypted store", async () => {
    const { PUT } = await import("@/app/api/admin/global/ai/credentials/route");
    const response = await PUT(
      new Request("http://localhost/api/admin/global/ai/credentials", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentialProvider: "ai_xai_grok",
          apiKey: "xai-test-key",
          defaultModel: "grok-test",
        }),
      }) as any,
    );

    expect(response.status).toBe(200);
    expect(upsertGlobalCredentials).toHaveBeenCalledWith(
      "ai_xai_grok",
      { apiKey: "xai-test-key" },
      "user-1",
      expect.objectContaining({ defaultModel: "grok-test" }),
    );
  });

  it("rejects unsupported provider names", async () => {
    const { PUT } = await import("@/app/api/admin/global/ai/credentials/route");
    const response = await PUT(
      new Request("http://localhost/api/admin/global/ai/credentials", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentialProvider: "not_a_provider",
          apiKey: "xai-test-key",
        }),
      }) as any,
    );

    expect(response.status).toBe(400);
    expect(upsertGlobalCredentials).not.toHaveBeenCalled();
  });

  it("tests a saved provider credential without returning the secret", async () => {
    const { POST } = await import("@/app/api/admin/global/ai/credentials/test/route");
    const response = await POST(
      new Request("http://localhost/api/admin/global/ai/credentials/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentialProvider: "ai_xai_grok",
        }),
      }) as any,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getGlobalCredentials).toHaveBeenCalledWith("ai_xai_grok");
    expect(testSavedAiProviderKey).toHaveBeenCalledWith("ai_xai_grok", {
      apiKey: "xai-test-key",
    });
    expect(JSON.stringify(body)).not.toContain("xai-test-key");
    expect(body.result.message).toContain("Key validated");
  });
});
