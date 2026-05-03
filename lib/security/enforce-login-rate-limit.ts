import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { limitOrThrow, loginRateLimit } from "@/lib/security/rate-limit";

/** Login route — 10 requests / 15 min per IP (Upstash). Missing Redis → allow (dev). */
export async function enforceLoginRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  const { ok } = await limitOrThrow(loginRateLimit, `login:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}
