import type { NextRequest } from "next/server";

/**
 * Canonical browser origin for OAuth redirect URLs — prefers `NEXT_PUBLIC_APP_URL`, then proxy headers.
 */
export function resolveAppOriginFromRequest(request: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
