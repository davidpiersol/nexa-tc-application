import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiRateLimit, limitOrThrow } from "@/lib/security/rate-limit";

/** Node Route Handler helper — 100 req/min per user id or IP (Upstash). */
export async function enforceApiRateLimit(
  request: NextRequest,
  userId?: string | null,
): Promise<NextResponse | null> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  const key = userId ?? ip;
  const { ok } = await limitOrThrow(apiRateLimit, key);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}
