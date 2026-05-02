import { describe, expect, it } from "vitest";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  generateCsrfToken,
} from "@/lib/security/csrf-constants";

describe("lib/security/csrf-constants", () => {
  it("exposes stable cookie and header names", () => {
    expect(CSRF_COOKIE_NAME).toBe("nexa_csrf");
    expect(CSRF_HEADER_NAME).toBe("x-csrf-token");
  });

  it("generateCsrfToken produces 64 hex chars (32 bytes)", () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    expect(a).toHaveLength(64);
    expect(a).not.toBe(b);
    expect(/^[\da-f]+$/.test(a)).toBe(true);
  });
});
