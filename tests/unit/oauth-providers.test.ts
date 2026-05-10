import { describe, expect, it } from "vitest";
import {
  parseEnabledOAuthProvidersFromEnv,
  toSupabaseProvider,
  type OAuthUiKey,
} from "@/lib/auth/oauth-providers";

describe("lib/auth/oauth-providers", () => {
  it("parses comma-separated provider keys", () => {
    expect(parseEnabledOAuthProvidersFromEnv("google, azure ,LinkedIn_oidc")).toEqual([
      "google",
      "azure",
      "linkedin_oidc",
    ]);
  });

  it("returns empty when unset", () => {
    expect(parseEnabledOAuthProvidersFromEnv(undefined)).toEqual([]);
    expect(parseEnabledOAuthProvidersFromEnv("")).toEqual([]);
  });

  it("maps UI keys to Supabase provider ids", () => {
    const keys: OAuthUiKey[] = ["google", "azure", "apple", "facebook", "linkedin_oidc"];
    for (const k of keys) {
      expect(toSupabaseProvider(k)).toBe(k);
    }
  });
});
