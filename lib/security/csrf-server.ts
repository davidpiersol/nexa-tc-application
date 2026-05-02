import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

/** Route handlers: require matching header and httpOnly cookie. */
export async function validateCsrf(request: NextRequest): Promise<boolean> {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return true;

  const header = request.headers.get(CSRF_HEADER_NAME);
  const cookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!header || !cookie || header !== cookie) return false;
  return true;
}

/** Optional helper for Server Actions (cookie presence only). */
export async function validateCsrfFromCookies(): Promise<boolean> {
  const store = await cookies();
  const cookie = store.get(CSRF_COOKIE_NAME)?.value;
  return Boolean(cookie);
}
