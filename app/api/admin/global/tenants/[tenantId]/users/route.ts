import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(120).optional(),
});

type Params = { params: { tenantId: string } };

export async function GET(request: NextRequest, { params }: Params) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  const { error } = await requireGlobalAdmin();
  if (error) return error;

  const admin = createServiceRoleClient();
  const candidatesOnly =
    request.nextUrl.searchParams.get("candidates") === "1" ||
    request.nextUrl.searchParams.get("candidates") === "true";

  const base = admin
    .from("users")
    .select("id, email, role, full_name, created_at")
    .eq("tenant_id", params.tenantId)
    .order("created_at", { ascending: false });
  const query = candidatesOnly ? base.eq("role", "admin") : base;

  const { data, error: qErr } = await query;
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

export async function POST(request: NextRequest, { params }: Params) {
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
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });
  const requestedRole = "tenant_admin" as const;

  const admin = createServiceRoleClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { tenant_id: params.tenantId, role: requestedRole },
    app_metadata: { tenant_id: params.tenantId, role: requestedRole },
  });
  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message ?? "create_user_failed" }, { status: 400 });
  }

  const dbRole = "admin";
  const { error: profileErr } = await admin.from("users").insert({
    id: created.user.id,
    tenant_id: params.tenantId,
    email: parsed.data.email.trim().toLowerCase(),
    role: dbRole,
    full_name: parsed.data.fullName?.trim() || null,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileErr.message }, { status: 400 });
  }
  await admin.from("user_role_memberships").insert({
    tenant_id: params.tenantId,
    user_id: created.user.id,
    role: dbRole,
  });

  await admin.from("audit_log").insert({
    tenant_id: params.tenantId,
    table_name: "users",
    record_id: created.user.id,
    operation: "INSERT",
    old_data: null,
    new_data: {
      source: "api",
      operation: "global_admin_create_user",
      detail: { actor_user_id: current.userId, role: dbRole },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true, userId: created.user.id });
}
