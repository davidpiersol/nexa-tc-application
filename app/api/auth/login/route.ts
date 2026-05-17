import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceLoginRateLimit } from "@/lib/security/enforce-login-rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const limited = await enforceLoginRateLimit(request);
  if (limited) return limited;

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;
  if (!email || !password) {
    return NextResponse.json({ error: "email_and_password_required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    let message = error.message;
    if (
      process.env.NODE_ENV === "development" &&
      message === "fetch failed" &&
      typeof (error as { cause?: unknown }).cause === "object" &&
      (error as { cause?: { code?: string } }).cause?.code === "ECONNREFUSED"
    ) {
      message =
        "cannot_reach_supabase — Nothing is accepting connections at your NEXT_PUBLIC_SUPABASE_URL (often 127.0.0.1:54321). Run `npx supabase start` or switch URL/keys to a hosted Supabase project.";
    }
    return NextResponse.json({ error: message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
