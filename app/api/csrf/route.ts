import { NextResponse } from "next/server";
import { CSRF_COOKIE_NAME, generateCsrfToken } from "@/lib/security/csrf-constants";

/**
 * Bootstrap CSRF: sets httpOnly cookie and returns the same token for `x-csrf-token` on mutations.
 */
export async function GET() {
  const token = generateCsrfToken();
  const res = NextResponse.json({ csrfToken: token });
  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
