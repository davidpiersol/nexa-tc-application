import { describe, expect, it } from "vitest";
import { resolveActiveRole } from "@/lib/auth/role-memberships";

describe("role memberships", () => {
  it("keeps the active role when it remains allowed", () => {
    expect(resolveActiveRole("tc", ["tc", "broker"])).toBe("tc");
  });

  it("falls back to the first allowed role when the active role is removed", () => {
    expect(resolveActiveRole("tc", ["broker", "admin"])).toBe("broker");
  });

  it("preserves current role when no replacement is supplied", () => {
    expect(resolveActiveRole("tc", [])).toBe("tc");
  });
});
