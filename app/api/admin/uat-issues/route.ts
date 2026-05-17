import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireTenantAdminOrGlobal } from "@/lib/auth/admin-guard";
import { isGlobalAdminRole } from "@/lib/auth/roles";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "triaged", "planned", "closed"]),
});

export async function GET(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  const { actor, error } = await requireTenantAdminOrGlobal();
  if (error) return error;
  const current = actor!;
  const admin = createServiceRoleClient();
  let query = admin
    .from("uat_issues")
    .select("id, tenant_id, issue_type, title, description, current_url, severity, status, created_at, submitted_by")
    .order("created_at", { ascending: false });
  if (!isGlobalAdminRole(current.role)) query = query.eq("tenant_id", current.tenantId);
  const { data, error: qErr } = await query;
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  return NextResponse.json({ issues: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  const { actor, error } = await requireTenantAdminOrGlobal();
  if (error) return error;
  const current = actor!;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });
  const admin = createServiceRoleClient();
  let query = admin.from("uat_issues").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (!isGlobalAdminRole(current.role)) query = query.eq("tenant_id", current.tenantId);
  const { error: upErr } = await query;
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
