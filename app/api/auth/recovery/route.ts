import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim();
  if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });
  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${base}/auth/recovery` });
  return NextResponse.json({ ok: true });
}
