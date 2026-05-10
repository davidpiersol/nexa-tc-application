import { describe, expect, it } from "vitest";
import { MFA_REQUIRED_ROLES, roleFromUser, roleRequiresMfa } from "@/lib/auth/mfa";

describe("lib/auth/mfa", () => {
  it("roleRequiresMfa matches privileged roles", () => {
    expect(roleRequiresMfa("tc")).toBe(true);
    expect(roleRequiresMfa("admin")).toBe(true);
    expect(roleRequiresMfa("tenant_admin")).toBe(true);
    expect(roleRequiresMfa("global_admin")).toBe(true);
    expect(roleRequiresMfa("superadmin")).toBe(true);
    expect(roleRequiresMfa("buyer")).toBe(false);
    expect(roleRequiresMfa(undefined)).toBe(false);
  });

  it("exports role set for docs/tests", () => {
    expect(MFA_REQUIRED_ROLES.has("tc")).toBe(true);
  });

  it("roleFromUser prefers user_metadata over app_metadata", () => {
    expect(
      roleFromUser({
        user_metadata: { role: "agent" },
        app_metadata: { role: "tc" },
      }),
    ).toBe("agent");
    expect(roleFromUser({ app_metadata: { role: "buyer" } })).toBe("buyer");
  });
});
