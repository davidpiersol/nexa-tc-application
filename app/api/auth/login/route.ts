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
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
