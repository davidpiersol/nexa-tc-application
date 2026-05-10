import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const assignSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
});

const revokeSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  fallbackRole: z.enum(["tc", "agent", "broker"]).optional(),
});

export async function POST(request: NextRequest) {
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
  const parsed = assignSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: userRow, error: userErr } = await admin
    .from("users")
    .select("id, tenant_id")
    .eq("id", parsed.data.userId)
    .maybeSingle();
  if (userErr || !userRow) return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  if (userRow.tenant_id !== parsed.data.tenantId) {
    return NextResponse.json({ error: "tenant_mismatch" }, { status: 400 });
  }

  const { error: roleErr } = await admin
    .from("users")
    .update({ role: "tenant_admin" })
    .eq("id", parsed.data.userId);
  if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 400 });

  const { error: assignErr } = await admin.from("tenant_admin_assignments").insert({
    tenant_id: parsed.data.tenantId,
    user_id: parsed.data.userId,
    assigned_by: current.userId,
  });
  if (assignErr) return NextResponse.json({ error: assignErr.message }, { status: 400 });

  await admin.from("audit_log").insert({
    tenant_id: parsed.data.tenantId,
    table_name: "tenant_admin_assignments",
    record_id: null,
    operation: "INSERT",
    old_data: null,
    new_data: {
      source: "api",
      operation: "global_admin_assign_tenant_admin",
      detail: { actor_user_id: current.userId, user_id: parsed.data.userId },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
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
  const parsed = revokeSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const admin = createServiceRoleClient();
  const fallback = parsed.data.fallbackRole ?? "tc";

  const { error: roleErr } = await admin
    .from("users")
    .update({ role: fallback })
    .eq("id", parsed.data.userId)
    .eq("tenant_id", parsed.data.tenantId);
  if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 400 });

  const { error: revokeErr } = await admin
    .from("tenant_admin_assignments")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: current.userId,
    })
    .eq("tenant_id", parsed.data.tenantId)
    .eq("user_id", parsed.data.userId)
    .is("revoked_at", null);
  if (revokeErr) return NextResponse.json({ error: revokeErr.message }, { status: 400 });

  await admin.from("audit_log").insert({
    tenant_id: parsed.data.tenantId,
    table_name: "tenant_admin_assignments",
    record_id: null,
    operation: "UPDATE",
    old_data: null,
    new_data: {
      source: "api",
      operation: "global_admin_revoke_tenant_admin",
      detail: {
        actor_user_id: current.userId,
        user_id: parsed.data.userId,
        fallback_role: fallback,
      },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true });
}

