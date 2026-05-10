import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware";
import {
  allowedBeforeMfaComplete,
  isProtectedPath,
} from "@/lib/auth/paths";
import { roleFromUser, roleRequiresMfa } from "@/lib/auth/mfa";
import { isGlobalAdminRole, isTenantAdminRole } from "@/lib/auth/roles";

const ROLE_SCOPED_PREFIXES = new Set([
  "agent",
  "buyer",
  "seller",
  "mortgage",
  "title",
]);

function firstPathSegments(pathname: string): { scope: string; id: string | null } {
  const parts = pathname.split("/").filter(Boolean);
  return { scope: parts[0] ?? "", id: parts[1] ?? null };
}
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
    const { scope, id: scopedId } = firstPathSegments(pathname);

    if (scope === "tc" && !["tc", "admin", "superadmin", "tenant_admin"].includes(role)) {
      return new NextResponse(null, { status: 403 });
    }

    if (scope === "admin") {
      if (scopedId === "global" && !isGlobalAdminRole(role)) {
        return new NextResponse(null, { status: 403 });
      }
      if (scopedId === "tenant" && !isTenantAdminRole(role)) {
        return new NextResponse(null, { status: 403 });
      }
      if (!scopedId) {
        const target = isGlobalAdminRole(role)
          ? "/admin/global/dashboard"
          : "/admin/tenant/dashboard";
        return NextResponse.redirect(new URL(target, request.url));
      }
    }

    if (ROLE_SCOPED_PREFIXES.has(scope)) {
      const sameRoleScope = role === scope;
      const tcCrossRoleScope = role === "tc";
      const brokerAgentScope = role === "broker" && scope === "agent";

      if (!sameRoleScope && !tcCrossRoleScope && !brokerAgentScope) {
        return new NextResponse(null, { status: 403 });
      }

      if (scopedId) {
        const { data: link } = await supabase
          .from("transaction_parties")
          .select("id")
          .eq("transaction_id", scopedId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!link) {
          return new NextResponse(null, { status: 403 });
        }
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
