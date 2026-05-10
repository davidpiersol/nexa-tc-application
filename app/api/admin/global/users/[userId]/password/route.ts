import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

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

  const admin = createServiceRoleClient();
  const { data: userRow } = await admin
    .from("users")
    .select("tenant_id")
    .eq("id", params.userId)
    .maybeSingle();

  const { error: pwErr } = await admin.auth.admin.updateUserById(params.userId, {
    password: parsed.data.password,
  });
  if (pwErr) return NextResponse.json({ error: pwErr.message }, { status: 400 });

  await admin.from("audit_log").insert({
    tenant_id: userRow?.tenant_id ?? current.tenantId,
    table_name: "users",
    record_id: params.userId,
    operation: "UPDATE",
    old_data: null,
    new_data: {
      source: "api",
      operation: "global_admin_password_reset",
      detail: { actor_user_id: current.userId },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true });
}

