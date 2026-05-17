import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const patchSchema = z.object({ password: z.string().min(8) });

export async function PATCH(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const { error: updateErr } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  await admin.from("audit_log").insert({
    tenant_id: profile?.tenant_id ?? null,
    table_name: "users",
    record_id: user.id,
    operation: "UPDATE",
    old_data: null,
    new_data: {
      source: "api",
      operation: "self_password_change",
      detail: { actor_user_id: user.id },
    },
    actor_id: user.id,
  });

  return NextResponse.json({ ok: true });
}
