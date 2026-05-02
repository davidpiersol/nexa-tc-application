import { describe, expect, it, vi, afterEach } from "vitest";

describe("lib/supabase/env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses placeholders when vars missing or blank", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "   ");
    const { resolvePublicSupabaseUrl, resolvePublicSupabaseAnonKey } =
      await import("@/lib/supabase/env");
    expect(resolvePublicSupabaseUrl()).toBe("https://placeholder.supabase.co");
    expect(resolvePublicSupabaseAnonKey()).toBe("placeholder-anon-key");
  });

  it("preserves non-empty trimmed values", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", " https://x.supabase.co ");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "abc");
    const { resolvePublicSupabaseUrl, resolvePublicSupabaseAnonKey } =
      await import("@/lib/supabase/env");
    expect(resolvePublicSupabaseUrl()).toBe("https://x.supabase.co");
    expect(resolvePublicSupabaseAnonKey()).toBe("abc");
  });
});
