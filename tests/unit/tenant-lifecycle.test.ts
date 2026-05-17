import { describe, expect, it } from "vitest";
import { tenantIsAccessible, tenantLifecycleLabel } from "@/lib/tenants/lifecycle";

describe("tenant lifecycle", () => {
  it("treats ordinary tenants as active and accessible", () => {
    expect(tenantLifecycleLabel({ is_suspended: false, archived_at: null })).toBe("active");
    expect(tenantIsAccessible({ is_suspended: false, archived_at: null })).toBe(true);
  });

  it("treats suspended tenants as deactivated", () => {
    expect(tenantLifecycleLabel({ is_suspended: true, archived_at: null })).toBe("deactivated");
    expect(tenantIsAccessible({ is_suspended: true, archived_at: null })).toBe(false);
  });

  it("lets archive state outrank deactivation state", () => {
    expect(tenantLifecycleLabel({ is_suspended: true, archived_at: "2026-05-17T00:00:00.000Z" })).toBe("archived");
    expect(tenantIsAccessible({ is_suspended: true, archived_at: "2026-05-17T00:00:00.000Z" })).toBe(false);
  });
});
