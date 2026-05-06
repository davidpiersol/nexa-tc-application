import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { validateCsrf } from "@/lib/security/csrf-server";
import { createClient } from "@/lib/supabase/server";

/** Ends Supabase session and clears auth cookies (same pattern as login route). */
export async function POST(request: NextRequest) {
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
