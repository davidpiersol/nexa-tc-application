import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { inngest } from "@/lib/inngest/client";
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
    .select(
      "id, status, close_date, closed_at, archived_at, property_address, mls_number, notes, intake_data, first_pass_status, updated_at",
    )
    .eq("tenant_id", tenantRow.tenant_id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ transactions: data ?? [] });
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

  let body: {
    mls_number?: string | null;
    property_address?: string | null;
    transaction_type?: string | null;
    close_date?: string | null;
    intake_data?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const intakeData =
    body.intake_data && typeof body.intake_data === "object" && !Array.isArray(body.intake_data)
      ? body.intake_data
      : {};

  const insertPayload = {
    tenant_id: tenantRow.tenant_id,
    mls_number: body.mls_number?.trim() || null,
    property_address: body.property_address?.trim() || null,
    transaction_type: body.transaction_type?.trim() || null,
    close_date: body.close_date?.trim() || null,
    intake_data: intakeData,
    created_by: user.id,
    status: "draft" as const,
  };

  const { data: row, error } = await supabase
    .from("transactions")
    .insert(insertPayload)
    .select("id, tenant_id, mls_number")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 500 });
  }

  await insertApiAudit(request, supabase, {
    tenantId: tenantRow.tenant_id,
    transactionId: row.id,
    operation: "transactions.create",
    detail: { mls_number: row.mls_number },
  });

  if (row.mls_number) {
    try {
      await inngest.send({
        name: "transaction.opened",
        data: {
          transactionId: row.id,
          tenantId: row.tenant_id,
          mlsNumber: row.mls_number,
          documentIds: [] as string[],
        },
      });
    } catch (e) {
      console.warn("[POST /api/transactions] inngest.send", e);
    }
  }

  return NextResponse.json({ transaction: row });
}
