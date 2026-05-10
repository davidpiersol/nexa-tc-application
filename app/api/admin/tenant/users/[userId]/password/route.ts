import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireTenantAdminOrGlobal } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { isGlobalAdminRole } from "@/lib/auth/roles";

const patchSchema = z.object({
  password: z.string().min(8),
});

type Params = { params: { userId: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }
  const { actor, error } = await requireTenantAdminOrGlobal();
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

  const admin = createServiceRoleClient();
  const { data: userRow, error: userErr } = await admin
    .from("users")
    .select("id, tenant_id")
    .eq("id", params.userId)
    .maybeSingle();
  if (userErr || !userRow) return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  if (!isGlobalAdminRole(current.role) && userRow.tenant_id !== current.tenantId) {
    return NextResponse.json({ error: "forbidden_cross_tenant" }, { status: 403 });
  }

  const { error: pwErr } = await admin.auth.admin.updateUserById(params.userId, {
    password: parsed.data.password,
  });
  if (pwErr) return NextResponse.json({ error: pwErr.message }, { status: 400 });

  await admin.from("audit_log").insert({
    tenant_id: userRow.tenant_id,
    table_name: "users",
    record_id: params.userId,
    operation: "UPDATE",
    old_data: null,
    new_data: {
      source: "api",
      operation: "tenant_admin_password_reset",
      detail: { actor_user_id: current.userId },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true });
}

