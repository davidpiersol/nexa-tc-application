import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware";
import {
  allowedBeforeMfaComplete,
  isProtectedPath,
} from "@/lib/auth/paths";
import { roleFromUser, roleRequiresMfa } from "@/lib/auth/mfa";
function tenantFromUser(user: {
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): string {
  const um = user.user_metadata?.tenant_id;
  const am = user.app_metadata?.tenant_id;
  if (typeof um === "string") return um;
  if (typeof am === "string") return am;
  return "";
}

function nexaSkipMfa(): boolean {
  const v = process.env.NEXA_SKIP_MFA;
  return v === "1" || v === "true";
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  /* Rate limits: Upstash runs in Node — apply in Route Handlers / Server Actions (see lib/security/rate-limit.ts). */

  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createMiddlewareSupabase(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    requestHeaders.set("x-nexa-user-id", user.id);
    const tenant = tenantFromUser(user);
    if (tenant) requestHeaders.set("x-nexa-tenant-id", tenant);
    const role = roleFromUser(user);
    if (role) requestHeaders.set("x-nexa-role", role);

    if (roleRequiresMfa(role) && !nexaSkipMfa()) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const mfaOk = aal?.currentLevel === "aal2";

      if (!mfaOk) {
        if (pathname.startsWith("/api/") && !allowedBeforeMfaComplete(pathname)) {
          return NextResponse.json({ error: "mfa_required" }, { status: 401 });
        }
        if (!allowedBeforeMfaComplete(pathname)) {
          return NextResponse.redirect(new URL("/auth/mfa", request.url));
        }
      }
    }
  }

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/api/auth/role-redirect", request.url));
  }

  if (user) {
    const role = roleFromUser(user) ?? "";
    if (pathname.startsWith("/tc") && ["buyer", "seller", "mortgage", "title"].includes(role)) {
      return new NextResponse(null, { status: 403 });
    }
    const buyerSeg = /^\/buyer\/([^/]+)/.exec(pathname);
    if (buyerSeg && role === "tc") {
      const txId = buyerSeg[1];
      const { data: link } = await supabase
        .from("transaction_parties")
        .select("id")
        .eq("transaction_id", txId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!link) {
        return new NextResponse(null, { status: 403 });
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.svg|.*\\.png|.*\\.ico|.*\\.webp).*)",
  ],
};
