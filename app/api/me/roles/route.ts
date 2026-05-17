import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { loadActorContext } from "@/lib/auth/actor-context";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";

const patchSchema = z.object({ role: z.string().min(1) });

export async function GET(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("user_role_memberships")
    .select("role")
    .eq("user_id", actor.userId)
    .eq("tenant_id", actor.tenantId)
    .order("role");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const roles = (data ?? []).map((row) => row.role);
  return NextResponse.json({ roles: roles.length ? roles : [actor.role], activeRole: actor.role });
}

export async function PATCH(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });
  const admin = createServiceRoleClient();
  const { data: membership } = await admin
    .from("user_role_memberships")
    .select("role")
    .eq("user_id", actor.userId)
    .eq("tenant_id", actor.tenantId)
    .eq("role", parsed.data.role)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "role_not_allowed" }, { status: 403 });
  const { error: updateErr } = await admin.from("users").update({ role: parsed.data.role }).eq("id", actor.userId);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });
  const authRow = await admin.auth.admin.getUserById(actor.userId);
  const existingUserMeta = (authRow.data.user?.user_metadata ?? {}) as Record<string, unknown>;
  const existingAppMeta = (authRow.data.user?.app_metadata ?? {}) as Record<string, unknown>;
  const { error: authErr } = await admin.auth.admin.updateUserById(actor.userId, {
    user_metadata: { ...existingUserMeta, role: parsed.data.role, tenant_id: actor.tenantId },
    app_metadata: { ...existingAppMeta, role: parsed.data.role, tenant_id: actor.tenantId },
  });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });
  return NextResponse.json({ ok: true, activeRole: parsed.data.role });
}
