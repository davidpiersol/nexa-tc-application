import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const optionalText = (schema: z.ZodString) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  seatLimit: z.number().int().min(1).max(10000).optional(),
  companyType: optionalText(z.string().min(2).max(80)),
  companyEmail: optionalText(z.string().email()),
  companyPhone: optionalText(z.string().max(40)),
  website: optionalText(z.string().max(120)),
  address1: optionalText(z.string().max(180)),
  address2: optionalText(z.string().max(180)),
  city: optionalText(z.string().max(80)),
  state: optionalText(z.string().max(80)),
  postalCode: optionalText(z.string().max(20)),
  country: optionalText(z.string().max(80)),
  notes: optionalText(z.string().max(500)),
});

type Params = { params: { tenantId: string } };

function missingColumn(message: string, column: string): boolean {
  return message.toLowerCase().includes(`column tenants.${column} does not exist`);
}

export async function GET(request: NextRequest, { params }: Params) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  const { error } = await requireGlobalAdmin();
  if (error) return error;

  const admin = createServiceRoleClient();
  let [{ data: tenant, error: tErr }, { data: primaryAdmin }] = await Promise.all([
    admin
      .from("tenants")
      .select("id, name, slug, seat_limit, is_suspended, settings, created_at")
      .eq("id", params.tenantId)
      .maybeSingle(),
    admin
      .from("users")
      .select("id, email, full_name, role")
      .eq("tenant_id", params.tenantId)
      .in("role", ["tenant_admin", "admin"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  if (tErr && (missingColumn(tErr.message, "is_suspended") || missingColumn(tErr.message, "settings"))) {
    const fallback = await admin
      .from("tenants")
      .select("id, name, slug, seat_limit, created_at")
      .eq("id", params.tenantId)
      .maybeSingle();
    tenant = fallback.data as typeof tenant;
    tErr = fallback.error;
  }
  if (tErr && missingColumn(tErr.message, "seat_limit")) {
    const fallback = await admin
      .from("tenants")
      .select("id, name, slug, created_at")
      .eq("id", params.tenantId)
      .maybeSingle();
    tenant = fallback.data as typeof tenant;
    tErr = fallback.error;
  }
  if (tErr || !tenant) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });

  const [{ count: activeUsers }, { count: pendingRequests }] = await Promise.all([
    admin.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", params.tenantId),
    admin
      .from("tenant_access_requests")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", params.tenantId)
      .eq("status", "pending"),
  ]);

  return NextResponse.json({
    tenant: {
      ...tenant,
      primaryContact: primaryAdmin ?? null,
      usage: {
        seatsAssigned: activeUsers ?? 0,
        seatsPending: pendingRequests ?? 0,
      },
    },
  });
}

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
  let { data: existing } = await admin
    .from("tenants")
    .select("id, settings")
    .eq("id", params.tenantId)
    .maybeSingle();
  if (!existing) {
    const fallback = await admin.from("tenants").select("id").eq("id", params.tenantId).maybeSingle();
    existing = fallback.data ? { ...fallback.data, settings: {} } : null;
  }
  if (!existing) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name.trim();
  if (typeof parsed.data.seatLimit === "number") updates.seat_limit = parsed.data.seatLimit;

  const mergedSettings = {
    ...(existing.settings ?? {}),
    ...(parsed.data.companyType !== undefined ? { companyType: parsed.data.companyType } : {}),
    ...(parsed.data.companyEmail !== undefined ? { companyEmail: parsed.data.companyEmail } : {}),
    ...(parsed.data.companyPhone !== undefined ? { companyPhone: parsed.data.companyPhone } : {}),
    ...(parsed.data.website !== undefined ? { website: parsed.data.website } : {}),
    ...(parsed.data.address1 !== undefined ? { address1: parsed.data.address1 } : {}),
    ...(parsed.data.address2 !== undefined ? { address2: parsed.data.address2 } : {}),
    ...(parsed.data.city !== undefined ? { city: parsed.data.city } : {}),
    ...(parsed.data.state !== undefined ? { state: parsed.data.state } : {}),
    ...(parsed.data.postalCode !== undefined ? { postalCode: parsed.data.postalCode } : {}),
    ...(parsed.data.country !== undefined ? { country: parsed.data.country } : {}),
    ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
  };
  updates.settings = mergedSettings;

  let { data, error: updateErr } = await admin
    .from("tenants")
    .update(updates)
    .eq("id", params.tenantId)
    .select("id, name, slug, seat_limit, is_suspended, settings")
    .single();
  if (updateErr && (missingColumn(updateErr.message, "settings") || missingColumn(updateErr.message, "is_suspended"))) {
    const reduced = { ...updates };
    delete reduced.settings;
    const fallback = await admin
      .from("tenants")
      .update(reduced)
      .eq("id", params.tenantId)
      .select("id, name, slug, seat_limit")
      .single();
    data = fallback.data as typeof data;
    updateErr = fallback.error;
  }
  if (updateErr && missingColumn(updateErr.message, "seat_limit")) {
    const reduced = { ...updates };
    delete reduced.seat_limit;
    delete reduced.settings;
    const fallback = await admin
      .from("tenants")
      .update(reduced)
      .eq("id", params.tenantId)
      .select("id, name, slug")
      .single();
    data = fallback.data as typeof data;
    updateErr = fallback.error;
  }
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  await admin.from("audit_log").insert({
    tenant_id: params.tenantId,
    table_name: "tenants",
    record_id: params.tenantId,
    operation: "UPDATE",
    old_data: null,
    new_data: {
      source: "api",
      operation: "global_admin_tenant_update",
      detail: { actor_user_id: current.userId, updates },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true, tenant: data });
}
