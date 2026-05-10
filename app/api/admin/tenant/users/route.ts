import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireTenantAdminOrGlobal } from "@/lib/auth/admin-guard";
import { isGlobalAdminRole } from "@/lib/auth/roles";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { applyGroupToTenantSettings, groupForRole, groupMapFromTenantSettings, isTenantGroup } from "@/lib/admin/user-groups";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "tc", "agent", "broker", "buyer", "seller", "mortgage", "title"]),
  fullName: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  group: z.string().optional(),
});

function tableMissing(message: string, table: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes(`could not find the table 'public.${table}'`) ||
    msg.includes(`relation "public.${table}" does not exist`)
  );
}

export async function GET(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;

  const { actor, error } = await requireTenantAdminOrGlobal();
  if (error) return error;
  const current = actor!;

  const admin = createServiceRoleClient();
  const query = admin
    .from("users")
    .select("id, tenant_id, email, role, full_name, phone, created_at")
    .order("created_at", { ascending: false });

  const scoped = isGlobalAdminRole(current.role) ? query : query.eq("tenant_id", current.tenantId);
  const { data, error: qErr } = await scoped;
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const rows = data ?? [];
  if (isGlobalAdminRole(current.role)) return NextResponse.json({ users: rows });

  const { data: tenant } = await admin.from("tenants").select("id, settings").eq("id", current.tenantId).maybeSingle();
  const groupMap = groupMapFromTenantSettings(tenant?.settings);
  const users = rows.map((u) => ({
    ...u,
    group: groupMap[u.id] ?? groupForRole(u.role),
  }));
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
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
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const tenantId = current.tenantId;
  const admin = createServiceRoleClient();

  const [{ data: tenant }, { count: activeUsers }, pendingRes] = await Promise.all([
    admin.from("tenants").select("id, seat_limit").eq("id", tenantId).single(),
    admin.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    admin
      .from("tenant_access_requests")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "pending"),
  ]);
  const pending = pendingRes.error && tableMissing(pendingRes.error.message, "tenant_access_requests")
    ? 0
    : (pendingRes.count ?? 0);
  const limit = tenant?.seat_limit ?? 0;
  if ((activeUsers ?? 0) + pending + 1 > limit && !isGlobalAdminRole(current.role)) {
    return NextResponse.json({ error: "seat_limit_exceeded" }, { status: 409 });
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { tenant_id: tenantId, role: parsed.data.role },
    app_metadata: { tenant_id: tenantId, role: parsed.data.role },
  });
  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message ?? "create_user_failed" }, { status: 400 });
  }

  const { error: profileErr } = await admin.from("users").insert({
    id: created.user.id,
    tenant_id: tenantId,
    email: parsed.data.email.trim().toLowerCase(),
    role: parsed.data.role,
    full_name: parsed.data.fullName?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileErr.message }, { status: 400 });
  }

  await admin.from("audit_log").insert({
    tenant_id: tenantId,
    table_name: "users",
    record_id: created.user.id,
    operation: "INSERT",
    old_data: null,
    new_data: {
      source: "api",
      operation: "tenant_admin_create_user",
      detail: { actor_user_id: current.userId, role: parsed.data.role },
    },
    actor_id: current.userId,
  });

  const requestedGroup = parsed.data.group;
  if (requestedGroup && isTenantGroup(requestedGroup)) {
    const { data: tenantRow } = await admin
      .from("tenants")
      .select("id, settings")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenantRow) {
      const settings = applyGroupToTenantSettings(tenantRow.settings, created.user.id, requestedGroup);
      await admin.from("tenants").update({ settings }).eq("id", tenantId);
    }
  }

  return NextResponse.json({ ok: true, userId: created.user.id });
}

