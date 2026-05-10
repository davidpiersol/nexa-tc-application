/**
 * OAuth provider keys enabled via env — maps UI/config names to Supabase Auth provider ids.
 * See https://supabase.com/docs/guides/auth/social-login
 */

export type OAuthUiKey = "google" | "azure" | "apple" | "facebook" | "linkedin_oidc";

/** Supabase `signInWithOAuth({ provider })` string */
export type SupabaseOAuthProvider =
  | "google"
  | "azure"
  | "apple"
  | "facebook"
  | "linkedin_oidc";

export const OAUTH_UI_KEYS: readonly OAuthUiKey[] = [
  "google",
  "azure",
  "apple",
  "facebook",
  "linkedin_oidc",
] as const;

const UI_TO_SUPABASE: Record<OAuthUiKey, SupabaseOAuthProvider> = {
  google: "google",
  azure: "azure",
  apple: "apple",
  facebook: "facebook",
  linkedin_oidc: "linkedin_oidc",
};

export const OAUTH_PROVIDER_LABELS: Record<OAuthUiKey, string> = {
  google: "Google",
  azure: "Microsoft",
  apple: "Apple",
  facebook: "Facebook",
  linkedin_oidc: "LinkedIn",
};

/**
 * Parses `NEXT_PUBLIC_OAUTH_PROVIDERS` — comma-separated ui keys, e.g. `google,azure,apple`.
 * Unknown tokens are ignored. Empty/unset means no providers (local dev default).
 */
export function parseEnabledOAuthProvidersFromEnv(envValue: string | undefined): OAuthUiKey[] {
  if (!envValue?.trim()) return [];
  const raw = envValue.split(/[\s,]+/).map((s) => s.trim().toLowerCase());
  const out: OAuthUiKey[] = [];
  for (const token of raw) {
    if (!token) continue;
    const key = token as OAuthUiKey;
    if (OAUTH_UI_KEYS.includes(key) && !out.includes(key)) out.push(key);
  }
  return out;
}

export function toSupabaseProvider(ui: OAuthUiKey): SupabaseOAuthProvider {
  return UI_TO_SUPABASE[ui];
}

export function isOAuthUiKey(s: string): s is OAuthUiKey {
  return (OAUTH_UI_KEYS as readonly string[]).includes(s);
}
