/** Routes that never require a session (prefix match). */
export const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/auth/mfa",
  "/invite",
  "/api/csrf",
  "/api/invite",
  "/api/inngest",
  "/api/webhooks",
  "/_next",
  "/favicon.ico",
] as const;

/** Dashboard segments — require auth + MFA rules in middleware. */
export const PROTECTED_PREFIXES = [
  "/tc",
  "/agent",
  "/buyer",
  "/seller",
  "/mortgage",
  "/title",
] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Paths reachable before MFA is satisfied (privileged roles). */
export function allowedBeforeMfaComplete(pathname: string): boolean {
  if (pathname === "/") return true;
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth/mfa") ||
    pathname.startsWith("/invite") ||
    isPublicPath(pathname)
  );
}
