import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { verifyInviteToken } from "@/lib/invite/jwt";
import { OAUTH_INVITE_COOKIE_NAME } from "@/lib/auth/oauth-invite-cookie";
import {
  isOAuthUiKey,
  parseEnabledOAuthProvidersFromEnv,
  toSupabaseProvider,
  type OAuthUiKey,
} from "@/lib/auth/oauth-providers";
import { resolveAppOriginFromRequest } from "@/lib/auth/app-origin";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  provider: z.string().min(2),
  /** Signed invite JWT — optional; when set, OAuth callback provisions tenant/role from the invite. */
  inviteToken: z.string().min(10).optional(),
});

/**
 * Returns the Supabase-hosted OAuth URL (PKCE). Optionally stores an invite JWT in an HttpOnly cookie
 * so `/auth/callback` can complete provisioning after the IdP redirect.
 */
export async function POST(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const { provider: providerRaw, inviteToken } = parsed.data;
  if (!isOAuthUiKey(providerRaw)) {
    return NextResponse.json({ error: "unknown_provider" }, { status: 400 });
  }
  const providerUi: OAuthUiKey = providerRaw;

  const enabled = parseEnabledOAuthProvidersFromEnv(process.env.NEXT_PUBLIC_OAUTH_PROVIDERS);
  if (!enabled.includes(providerUi)) {
    return NextResponse.json({ error: "provider_disabled" }, { status: 400 });
  }

  if (inviteToken) {
    const invitePayload = await verifyInviteToken(inviteToken);
    if (!invitePayload) {
      return NextResponse.json({ error: "invalid_invite" }, { status: 400 });
    }
  }

  const origin = resolveAppOriginFromRequest(request);
  const redirectTo = `${origin}/auth/callback`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: toSupabaseProvider(providerUi),
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return NextResponse.json(
      { error: error?.message ?? "oauth_url_failed" },
      { status: 400 },
    );
  }

  const res = NextResponse.json({ url: data.url });

  if (inviteToken) {
    res.cookies.set(OAUTH_INVITE_COOKIE_NAME, inviteToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
  }

  return res;
}
