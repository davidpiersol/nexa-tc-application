import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const createSchema = z.object({
  resourceType: z.string().min(2).max(80),
  key: z.string().min(2).max(200),
  metadata: z.record(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  const { error } = await requireGlobalAdmin();
  if (error) return error;
  const admin = createServiceRoleClient();
  const { data, error: qErr } = await admin
    .from("global_resource_registry")
    .select("id, resource_type, key, metadata, is_active, updated_at")
    .order("updated_at", { ascending: false });
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

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
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data, error: insertErr } = await admin
    .from("global_resource_registry")
    .insert({
      resource_type: parsed.data.resourceType,
      key: parsed.data.key,
      metadata: parsed.data.metadata ?? {},
      created_by: current.userId,
      updated_by: current.userId,
    })
    .select("id, resource_type, key, metadata, is_active")
    .single();
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 400 });

  await admin.from("audit_log").insert({
    tenant_id: current.tenantId,
    table_name: "global_resource_registry",
    record_id: data.id,
    operation: "INSERT",
    old_data: null,
    new_data: {
      source: "api",
      operation: "global_resource_registry_create",
      detail: { actor_user_id: current.userId, resource_type: data.resource_type, key: data.key },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true, item: data });
}

