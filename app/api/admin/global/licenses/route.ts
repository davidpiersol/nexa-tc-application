import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const patchSchema = z.object({
  tenantId: z.string().uuid(),
  seatLimit: z.number().int().min(1).max(10000).optional(),
  suspended: z.boolean().optional(),
});

function missingColumn(message: string, column: string): boolean {
  return message.toLowerCase().includes(`column tenants.${column} does not exist`);
}

export async function PATCH(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const { actor, error } = await requireGlobalAdmin();
  if (error) return error;
  const current = actor!;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof parsed.data.seatLimit === "number") updates.seat_limit = parsed.data.seatLimit;
  if (typeof parsed.data.suspended === "boolean") updates.is_suspended = parsed.data.suspended;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no_updates" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  let { data, error: updateErr } = await admin
    .from("tenants")
    .update(updates)
    .eq("id", parsed.data.tenantId)
    .select("id, name, slug, seat_limit, is_suspended")
    .single();
  if (updateErr && missingColumn(updateErr.message, "is_suspended")) {
    const reduced = { ...updates };
    delete reduced.is_suspended;
    const fallback = await admin
      .from("tenants")
      .update(reduced)
      .eq("id", parsed.data.tenantId)
      .select("id, name, slug, seat_limit")
      .single();
    data = fallback.data as typeof data;
    updateErr = fallback.error;
  }
  if (updateErr && missingColumn(updateErr.message, "seat_limit")) {
    const reduced = { ...updates };
    delete reduced.is_suspended;
    delete reduced.seat_limit;
    const fallback = await admin
      .from("tenants")
      .update(reduced)
      .eq("id", parsed.data.tenantId)
      .select("id, name, slug")
      .single();
    data = fallback.data as typeof data;
    updateErr = fallback.error;
  }
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  await admin.from("audit_log").insert({
    tenant_id: parsed.data.tenantId,
    table_name: "tenants",
    record_id: parsed.data.tenantId,
    operation: "UPDATE",
    old_data: null,
    new_data: {
      source: "api",
      operation: "global_admin_license_update",
      detail: { actor_user_id: current.userId, ...updates },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true, tenant: data });
}

