import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: { id: string } };

export async function POST(request: NextRequest, ctx: Ctx) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const limited = await enforceApiRateLimit(request, user?.id);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: tenantRow } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!tenantRow?.tenant_id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: transaction, error: txErr } = await supabase
    .from("transactions")
    .select("id, status, close_date, archived_at")
    .eq("id", ctx.params.id)
    .eq("tenant_id", tenantRow.tenant_id)
    .maybeSingle();
  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
  if (!transaction) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (transaction.status !== "closed") {
    return NextResponse.json({ error: "archive_requires_closed_status" }, { status: 400 });
  }
  if (transaction.archived_at) return NextResponse.json({ transaction });

  const now = new Date().toISOString();
  const closeDate = transaction.close_date ?? now.slice(0, 10);
  const { data: updated, error: updateErr } = await supabase
    .from("transactions")
    .update({
      close_date: closeDate,
      archived_at: now,
      archived_by: user.id,
      updated_at: now,
    })
    .eq("id", ctx.params.id)
    .eq("tenant_id", tenantRow.tenant_id)
    .select("id, status, close_date, archived_at")
    .maybeSingle();
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  await insertApiAudit(request, supabase, {
    tenantId: tenantRow.tenant_id,
    transactionId: ctx.params.id,
    operation: "transactions.archive",
  });

  return NextResponse.json({ transaction: updated });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const limited = await enforceApiRateLimit(request, user?.id);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: tenantRow } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!tenantRow?.tenant_id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from("transactions")
    .update({
      archived_at: null,
      archived_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.params.id)
    .eq("tenant_id", tenantRow.tenant_id)
    .select("id, status, close_date, archived_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await insertApiAudit(request, supabase, {
    tenantId: tenantRow.tenant_id,
    transactionId: ctx.params.id,
    operation: "transactions.unarchive",
  });
  return NextResponse.json({ transaction: updated });
}
