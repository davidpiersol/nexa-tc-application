import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const limited = await enforceApiRateLimit(request, user?.id);
  if (limited) return limited;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const transactionId = request.nextUrl.searchParams.get("transaction_id");
  if (!transactionId) {
    return NextResponse.json({ error: "transaction_id_required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, body, created_at, sender_user_id, read_at")
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const limited = await enforceApiRateLimit(request, user?.id);
  if (limited) return limited;

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: tenantRow } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!tenantRow?.tenant_id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { transaction_id?: string; body?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.transaction_id || !body.body?.trim()) {
    return NextResponse.json({ error: "transaction_id_and_body_required" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("messages")
    .insert({
      tenant_id: tenantRow.tenant_id,
      transaction_id: body.transaction_id,
      sender_user_id: user.id,
      body: body.body.trim(),
    })
    .select("id, body, created_at, transaction_id")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 500 });
  }

  await insertApiAudit(request, supabase, {
    tenantId: tenantRow.tenant_id,
    transactionId: body.transaction_id,
    operation: "messages.create",
    detail: { messageId: row.id },
  });

  return NextResponse.json({ message: row });
}
