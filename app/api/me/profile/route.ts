import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const patchSchema = z.object({
  fullName: z.string().trim().min(1).max(120).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
});

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("users")
    .select("id, email, full_name, phone")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (parsed.data.fullName !== undefined) updates.full_name = parsed.data.fullName?.trim() || null;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone?.trim() || null;
  if (!Object.keys(updates).length) return NextResponse.json({ error: "no_updates" }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: profile, error: loadErr } = await admin
    .from("users")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();
  if (loadErr || !profile) return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  const { error: updateErr } = await admin.from("users").update(updates).eq("id", userId);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });
  await admin.from("audit_log").insert({
    tenant_id: profile.tenant_id,
    table_name: "users",
    record_id: userId,
    operation: "UPDATE",
    old_data: null,
    new_data: {
      source: "api",
      operation: "self_profile_update",
      detail: { actor_user_id: userId, fields: Object.keys(updates) },
    },
    actor_id: userId,
  });
  return NextResponse.json({ ok: true });
}
