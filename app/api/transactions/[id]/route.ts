import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: { id: string } };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { id } = ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const limited = await enforceApiRateLimit(request, user?.id);
  if (limited) return limited;
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

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantRow.tenant_id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ transaction: data });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = ctx.params;
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

  let patch: Record<string, unknown>;
  try {
    patch = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const allowed = [
    "status",
    "property_address",
    "mls_number",
    "close_date",
    "notes",
    "first_pass_status",
    "transaction_type",
  ] as const;
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in patch) update[k] = patch[k];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_allowed_fields" }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("transactions")
    .update(update)
    .eq("id", id)
    .eq("tenant_id", tenantRow.tenant_id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await insertApiAudit(request, supabase, {
    tenantId: tenantRow.tenant_id,
    transactionId: id,
    operation: "transactions.patch",
    detail: { fields: Object.keys(update) },
  });

  return NextResponse.json({ transaction: data });
}
