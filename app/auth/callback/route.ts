import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyInviteToken } from "@/lib/invite/jwt";
import { OAUTH_INVITE_COOKIE_NAME } from "@/lib/auth/oauth-invite-cookie";
import { completeOAuthInviteProvision } from "@/lib/auth/oauth-invite-complete";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { userHasPublicProfile } from "@/lib/auth/profile-check";

function safeRedirectOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (
    process.env.NODE_ENV !== "development" &&
    forwardedHost &&
    !forwardedHost.includes("localhost")
  ) {
    const proto = forwardedProto ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return url.origin;
}

/**
 * OAuth redirect handler — exchanges PKCE code for a session, provisions invite/profile, then lands the user.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = safeRedirectOrigin(request);
  const code = url.searchParams.get("code");
  const oauthErr = url.searchParams.get("error");
  const oauthErrDesc = url.searchParams.get("error_description");

  if (oauthErr) {
    const next = new URL("/auth/auth-code-error", origin);
    next.searchParams.set("reason", "oauth_denied");
    if (oauthErrDesc) next.searchParams.set("detail", oauthErrDesc.slice(0, 300));
    return NextResponse.redirect(next);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/auth-code-error?reason=missing_code", origin));
  }

  const supabase = await createClient();
  const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeErr) {
    return NextResponse.redirect(
      new URL(
        `/auth/auth-code-error?reason=exchange&message=${encodeURIComponent(exchangeErr.message)}`,
        origin,
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const cookieStore = await cookies();
  const inviteJwt = cookieStore.get(OAUTH_INVITE_COOKIE_NAME)?.value ?? null;

  const redirectWithCookieCleared = (path: string) => {
    const res = NextResponse.redirect(new URL(path, origin));
    res.cookies.delete(OAUTH_INVITE_COOKIE_NAME);
    return res;
  };

  if (await userHasPublicProfile(user.id)) {
    await supabase.auth.refreshSession();
    return redirectWithCookieCleared("/api/auth/role-redirect");
  }

  const invitePayload = inviteJwt ? await verifyInviteToken(inviteJwt) : null;

  if (inviteJwt && invitePayload) {
    const done = await completeOAuthInviteProvision({ user, invite: invitePayload });
    if (done.ok) {
      await supabase.auth.refreshSession();
      return redirectWithCookieCleared("/api/auth/role-redirect");
    }

    await supabase.auth.signOut();

    const fail = NextResponse.redirect(
      new URL(`/auth/auth-code-error?reason=${encodeURIComponent(done.code)}`, origin),
    );
    fail.cookies.delete(OAUTH_INVITE_COOKIE_NAME);
    return fail;
  }

  try {
    const admin = createServiceRoleClient();
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        oauth_pending_access: true,
      },
    });
  } catch {
    /* Service role may be unset in some dev installs — access-pending still applies via missing profile row. */
  }

  await supabase.auth.refreshSession();

  return redirectWithCookieCleared("/auth/access-pending");
}
