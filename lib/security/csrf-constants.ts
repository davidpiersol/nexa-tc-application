/** Shared CSRF identifiers (safe for Client Components). */
export const CSRF_COOKIE_NAME = "nexa_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

/** Create a CSRF secret for httpOnly cookie + caller-visible token (bootstrap). */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
