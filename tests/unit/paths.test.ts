import { describe, expect, it } from "vitest";
import {
  allowedBeforeMfaComplete,
  isProtectedPath,
  isPublicPath,
} from "@/lib/auth/paths";

describe("lib/auth/paths", () => {
  it("treats auth and api/csrf as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/api/csrf")).toBe(true);
    expect(isPublicPath("/api/invite/redeem")).toBe(true);
    expect(isPublicPath("/tc")).toBe(false);
  });

  it("detects protected dashboard prefixes", () => {
    expect(isProtectedPath("/tc")).toBe(true);
    expect(isProtectedPath("/admin/global")).toBe(true);
    expect(isProtectedPath("/buyer/x")).toBe(true);
    expect(isProtectedPath("/")).toBe(false);
  });

  it("allows MFA completion routes before AAL2", () => {
    expect(allowedBeforeMfaComplete("/")).toBe(true);
    expect(allowedBeforeMfaComplete("/auth/mfa")).toBe(true);
    expect(allowedBeforeMfaComplete("/auth/callback")).toBe(true);
    expect(allowedBeforeMfaComplete("/invite/token")).toBe(true);
    expect(allowedBeforeMfaComplete("/api/auth/login")).toBe(true);
    expect(allowedBeforeMfaComplete("/api/auth/logout")).toBe(true);
    expect(allowedBeforeMfaComplete("/api/auth/oauth/start")).toBe(true);
    expect(allowedBeforeMfaComplete("/api/auth/role-redirect")).toBe(true);
    expect(allowedBeforeMfaComplete("/tc")).toBe(false);
  });
});
