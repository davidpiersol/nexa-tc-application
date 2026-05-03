import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: { id: string } };

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

  let body: { completed?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "completed_required" }, { status: 400 });
  }

  const completedAt = body.completed ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("tasks")
    .update({
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantRow.tenant_id)
    .select("id, transaction_id, title, completed_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await insertApiAudit(request, supabase, {
    tenantId: tenantRow.tenant_id,
    transactionId: data.transaction_id,
    operation: "tasks.patch",
    detail: { taskId: id, completed: Boolean(data.completed_at) },
  });

  return NextResponse.json({ task: data });
}
