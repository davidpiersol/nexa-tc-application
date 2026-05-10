import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireTenantAdminOrGlobal } from "@/lib/auth/admin-guard";
import { isGlobalAdminRole } from "@/lib/auth/roles";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import {
  applyGroupToTenantSettings,
  groupForRole,
  groupMapFromTenantSettings,
  isTenantGroup,
} from "@/lib/admin/user-groups";

const patchSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(1).max(120).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  role: z.enum(["admin", "tc", "agent", "broker", "buyer", "seller", "mortgage", "title"]).optional(),
  group: z.string().optional(),
});

type Params = { params: { userId: string } };

async function scopedUserOrError(current: { role: string; tenantId: string }, userId: string) {
  const admin = createServiceRoleClient();
  const { data: userRow, error } = await admin
    .from("users")
    .select("id, tenant_id, email, role, full_name, phone")
    .eq("id", userId)
    .maybeSingle();
  if (error || !userRow) return { error: NextResponse.json({ error: "user_not_found" }, { status: 404 }) };
  if (!isGlobalAdminRole(current.role) && userRow.tenant_id !== current.tenantId) {
    return { error: NextResponse.json({ error: "forbidden_cross_tenant" }, { status: 403 }) };
  }
  return { admin, userRow };
}

export async function GET(request: NextRequest, { params }: Params) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  const { actor, error } = await requireTenantAdminOrGlobal();
  if (error) return error;
  const current = actor!;

  const scoped = await scopedUserOrError(current, params.userId);
  if ("error" in scoped) return scoped.error;

  const { admin, userRow } = scoped;
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, settings")
    .eq("id", userRow.tenant_id)
    .maybeSingle();
  const groupMap = groupMapFromTenantSettings(tenant?.settings);
  const group = groupMap[userRow.id] ?? groupForRole(userRow.role);

  return NextResponse.json({
    user: {
      ...userRow,
      group,
    },
  });
}

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

  const scoped = await scopedUserOrError(current, params.userId);
  if ("error" in scoped) return scoped.error;
  const { admin, userRow } = scoped;

  const updates: Record<string, unknown> = {};
  if (parsed.data.email) updates.email = parsed.data.email.trim().toLowerCase();
  if (parsed.data.fullName !== undefined) updates.full_name = parsed.data.fullName?.trim() || null;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone?.trim() || null;
  if (parsed.data.role) updates.role = parsed.data.role;

  if (Object.keys(updates).length) {
    const { error: updateErr } = await admin.from("users").update(updates).eq("id", params.userId);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  if (parsed.data.email || parsed.data.role) {
    const authRow = await admin.auth.admin.getUserById(params.userId);
    const existingUserMeta = (authRow.data.user?.user_metadata ?? {}) as Record<string, unknown>;
    const existingAppMeta = (authRow.data.user?.app_metadata ?? {}) as Record<string, unknown>;
    const nextRole = parsed.data.role ?? (typeof existingUserMeta.role === "string" ? existingUserMeta.role : userRow.role);
    const tenantId = userRow.tenant_id;

    await admin.auth.admin.updateUserById(params.userId, {
      ...(parsed.data.email ? { email: parsed.data.email.trim().toLowerCase() } : {}),
      user_metadata: {
        ...existingUserMeta,
        role: nextRole,
        tenant_id: tenantId,
      },
      app_metadata: {
        ...existingAppMeta,
        role: nextRole,
        tenant_id: tenantId,
      },
    });
  }

  const requestedGroup = parsed.data.group;
  if (requestedGroup && isTenantGroup(requestedGroup)) {
    const { data: tenant } = await admin
      .from("tenants")
      .select("id, settings")
      .eq("id", userRow.tenant_id)
      .maybeSingle();
    if (tenant) {
      const settings = applyGroupToTenantSettings(tenant.settings, userRow.id, requestedGroup);
      await admin.from("tenants").update({ settings }).eq("id", userRow.tenant_id);
    }
  }

  await admin.from("audit_log").insert({
    tenant_id: userRow.tenant_id,
    table_name: "users",
    record_id: userRow.id,
    operation: "UPDATE",
    old_data: null,
    new_data: {
      source: "api",
      operation: "tenant_admin_update_user_profile",
      detail: { actor_user_id: current.userId, fields: Object.keys(parsed.data) },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true });
}

