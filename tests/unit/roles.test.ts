import { describe, expect, it } from "vitest";
import { asAppRole, isGlobalAdminRole, isPrivilegedRole, isTenantAdminRole } from "@/lib/auth/roles";

describe("lib/auth/roles", () => {
  it("recognizes known roles", () => {
    expect(asAppRole("tenant_admin")).toBe("tenant_admin");
    expect(asAppRole("global_admin")).toBe("global_admin");
    expect(asAppRole("bogus")).toBeNull();
  });

  it("handles global and tenant admin role checks", () => {
    expect(isGlobalAdminRole("global_admin")).toBe(true);
    expect(isGlobalAdminRole("superadmin")).toBe(true);
    expect(isGlobalAdminRole("tenant_admin")).toBe(false);

    expect(isTenantAdminRole("tenant_admin")).toBe(true);
    expect(isTenantAdminRole("admin")).toBe(true);
    expect(isTenantAdminRole("global_admin")).toBe(true);
    expect(isTenantAdminRole("buyer")).toBe(false);
  });

  it("marks privileged roles for MFA and guard checks", () => {
    expect(isPrivilegedRole("tc")).toBe(true);
    expect(isPrivilegedRole("tenant_admin")).toBe(true);
    expect(isPrivilegedRole("global_admin")).toBe(true);
    expect(isPrivilegedRole("seller")).toBe(false);
  });
});

