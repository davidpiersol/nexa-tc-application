import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { memoryLoginAttemptAllowed } from "@/lib/security/memory-login-limit";
import { limitOrThrow, loginRateLimit } from "@/lib/security/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/** Login route — 10 requests / 15 min per IP (Upstash). Missing Redis → in-memory fallback (single process). */
export async function enforceLoginRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";

  if (loginRateLimit) {
    const { ok } = await limitOrThrow(loginRateLimit, `login:${ip}`);
    if (!ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    return null;
  }

  const ok = memoryLoginAttemptAllowed(ip, MAX_ATTEMPTS, WINDOW_MS);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}
