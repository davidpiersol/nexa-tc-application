import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireTenantAdminOrGlobal } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { isGlobalAdminRole } from "@/lib/auth/roles";

const createSchema = z.object({
  email: z.string().email(),
  desiredRole: z.enum(["tc", "agent", "broker", "buyer", "seller", "mortgage", "title"]),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "revoke", "reject"]),
  notes: z.string().max(500).optional(),
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
    .from("tenant_access_requests")
    .select("id, email, desired_role, status, notes, created_at, requested_auth_user_id")
    .order("created_at", { ascending: false });

  const scoped = isGlobalAdminRole(current.role) ? query : query.eq("tenant_id", current.tenantId);
  const { data, error: qErr } = await scoped;
  if (qErr) {
    if (tableMissing(qErr.message, "tenant_access_requests")) {
      return NextResponse.json({ requests: [], warning: "tenant_access_requests_unavailable" });
    }
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }
  return NextResponse.json({ requests: data ?? [] });
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

  const admin = createServiceRoleClient();
  const tenantId = current.tenantId;
  const [{ data: tenant }, { count: activeUsers }, { count: pending }] = await Promise.all([
    admin.from("tenants").select("id, seat_limit").eq("id", tenantId).single(),
    admin.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    admin
      .from("tenant_access_requests")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "pending"),
  ]);

  const limit = tenant?.seat_limit ?? 0;
  const projected = (activeUsers ?? 0) + (pending ?? 0) + 1;
  if (projected > limit && !isGlobalAdminRole(current.role)) {
    await admin.from("audit_log").insert({
      tenant_id: tenantId,
      table_name: "tenant_access_requests",
      record_id: null,
      operation: "INSERT",
      old_data: null,
      new_data: {
        source: "api",
        operation: "tenant_admin_over_license_invite_blocked",
        detail: {
          actor_user_id: current.userId,
          seat_limit: limit,
          active_users: activeUsers ?? 0,
          pending_requests: pending ?? 0,
        },
      },
      actor_id: current.userId,
    });
    return NextResponse.json({ error: "seat_limit_exceeded" }, { status: 409 });
  }

  const { data: inserted, error: insertErr } = await admin
    .from("tenant_access_requests")
    .insert({
      tenant_id: tenantId,
      email: parsed.data.email.trim().toLowerCase(),
      desired_role: parsed.data.desiredRole,
      status: "pending",
      requested_by: current.userId,
    })
    .select("id, email, desired_role, status")
    .single();
  if (insertErr) {
    if (tableMissing(insertErr.message, "tenant_access_requests")) {
      return NextResponse.json({ error: "tenant_access_requests_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  await admin.from("audit_log").insert({
    tenant_id: tenantId,
    table_name: "tenant_access_requests",
    record_id: inserted.id,
    operation: "INSERT",
    old_data: null,
    new_data: {
      source: "api",
      operation: "tenant_admin_invite_request",
      detail: { actor_user_id: current.userId, desired_role: parsed.data.desiredRole },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true, request: inserted });
}

export async function PATCH(request: NextRequest) {
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

  const nextStatus = parsed.data.action === "approve" ? "approved" : parsed.data.action;
  const admin = createServiceRoleClient();
  const { data: existing, error: existingErr } = await admin
    .from("tenant_access_requests")
    .select("id, tenant_id, status, desired_role, requested_auth_user_id, email")
    .eq("id", parsed.data.id)
    .single();
  if (existingErr || !existing) {
    if (existingErr && tableMissing(existingErr.message, "tenant_access_requests")) {
      return NextResponse.json({ error: "tenant_access_requests_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "request_not_found" }, { status: 404 });
  }

  if (!isGlobalAdminRole(current.role) && existing.tenant_id !== current.tenantId) {
    return NextResponse.json({ error: "forbidden_cross_tenant" }, { status: 403 });
  }

  const patch: Record<string, unknown> = {
    status: nextStatus,
    notes: parsed.data.notes ?? null,
    approved_by: nextStatus === "approved" ? current.userId : null,
    revoked_by: nextStatus !== "approved" ? current.userId : null,
    updated_at: new Date().toISOString(),
  };

  const { error: updateErr } = await admin
    .from("tenant_access_requests")
    .update(patch)
    .eq("id", parsed.data.id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  if (nextStatus === "approved" && existing.requested_auth_user_id) {
    await admin
      .from("users")
      .update({
        tenant_id: existing.tenant_id,
        role: existing.desired_role,
        email: existing.email,
      })
      .eq("id", existing.requested_auth_user_id);
  }

  await admin.from("audit_log").insert({
    tenant_id: existing.tenant_id,
    table_name: "tenant_access_requests",
    record_id: existing.id,
    operation: "UPDATE",
    old_data: { status: existing.status },
    new_data: {
      source: "api",
      operation: `tenant_admin_request_${nextStatus}`,
      detail: { actor_user_id: current.userId, action: parsed.data.action },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true });
}

