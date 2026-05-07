import { NextResponse } from "next/server";
import { CSRF_COOKIE_NAME, generateCsrfToken } from "@/lib/security/csrf-constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Bootstrap CSRF: sets httpOnly cookie and returns the same token for `x-csrf-token` on mutations.
 */
export async function GET() {
  const token = generateCsrfToken();
  const res = NextResponse.json({ csrfToken: token });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
