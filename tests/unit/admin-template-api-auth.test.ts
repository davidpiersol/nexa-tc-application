import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/admin-guard", () => ({
  requireGlobalAdmin: vi.fn(async () => ({
    actor: null,
    error: NextResponse.json({ error: "forbidden" }, { status: 403 }),
  })),
}));

vi.mock("@/lib/security/enforce-rate-limit", () => ({
  enforceApiRateLimit: vi.fn(async () => null),
}));

vi.mock("@/lib/security/csrf-server", () => ({
  validateCsrf: vi.fn(async () => true),
}));

describe("admin template API auth", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("blocks non-global-admin template creation", async () => {
    const { POST } = await import("@/app/api/admin/global/templates/route");
    const req = new Request("http://localhost/api/admin/global/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        formNumber: "NMAR-2104",
        title: "Purchase Agreement",
        category: "contract",
        jurisdictionState: "NM",
      }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(403);
  });

  it("blocks non-global-admin mapping approval", async () => {
    const { PATCH } = await import(
      "@/app/api/admin/global/templates/[templateId]/versions/[versionId]/route"
    );
    const req = new Request("http://localhost/api/admin/global/templates/a/versions/b", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "approve_mappings",
      }),
    });
    const res = await PATCH(req as any, {
      params: {
        templateId: "a",
        versionId: "b",
      },
    });
    expect(res.status).toBe(403);
  });
});
