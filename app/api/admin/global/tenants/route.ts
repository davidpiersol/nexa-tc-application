import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  seatLimit: z.number().int().min(1).max(10000).optional(),
});

export async function GET(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;

  const { error } = await requireGlobalAdmin();
  if (error) return error;

  const admin = createServiceRoleClient();
  const { data: tenants, error: tenantErr } = await admin
    .from("tenants")
    .select("id, name, slug, is_suspended, seat_limit, created_at")
    .order("created_at", { ascending: false });
  if (tenantErr) return NextResponse.json({ error: tenantErr.message }, { status: 500 });

  const rows = await Promise.all(
    (tenants ?? []).map(async (t) => {
      const [{ count: activeUsers }, { count: pendingRequests }, { count: tenantAdmins }] =
        await Promise.all([
          admin.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", t.id),
          admin
            .from("tenant_access_requests")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", t.id)
            .eq("status", "pending"),
          admin
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", t.id)
            .in("role", ["tenant_admin", "admin"]),
        ]);
      return {
        ...t,
        usage: {
          activeUsers: activeUsers ?? 0,
          pendingRequests: pendingRequests ?? 0,
          tenantAdmins: tenantAdmins ?? 0,
        },
      };
    }),
  );

  return NextResponse.json({ tenants: rows });
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
  const parsed = createTenantSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: created, error: createErr } = await admin
    .from("tenants")
    .insert({
      name: parsed.data.name.trim(),
      slug: parsed.data.slug.trim(),
      seat_limit: parsed.data.seatLimit ?? 25,
      is_suspended: false,
    })
    .select("id, name, slug, seat_limit, is_suspended")
    .single();
  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });

  await admin.from("audit_log").insert({
    tenant_id: created.id,
    table_name: "tenants",
    record_id: created.id,
    operation: "INSERT",
    old_data: null,
    new_data: {
      source: "api",
      operation: "global_admin_tenant_create",
      detail: {
        actor_user_id: current.userId,
        seat_limit: created.seat_limit,
      },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({ ok: true, tenant: created });
}

