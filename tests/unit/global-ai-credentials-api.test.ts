import { beforeEach, describe, expect, it, vi } from "vitest";

const requireGlobalAdmin = vi.fn();
const listGlobalCredentialStatuses = vi.fn();
const upsertGlobalCredentials = vi.fn();
const auditInsert = vi.fn(async () => ({ error: null }));

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
  listGlobalCredentialStatuses,
  upsertGlobalCredentials,
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
});
