/**
 * Resolves public Supabase env for browser + middleware + server clients.
 * Empty strings in `.env.local` are treated as unset so placeholders still work for local dev/build.
 */
export function resolvePublicSupabaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return v || "https://placeholder.supabase.co";
}

export function resolvePublicSupabaseAnonKey(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return v || "placeholder-anon-key";
}
