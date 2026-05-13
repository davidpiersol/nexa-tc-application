import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { loadActorContext } from "@/lib/auth/actor-context";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import {
  normalizeSigningDeliveryMode,
  resolveSigningWorkflowSlug,
} from "@/lib/signing/signing-workflow";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  signing_platform: z.string().trim().max(120).optional(),
  signing_preferences: z.record(z.unknown()).optional(),
});

export async function PATCH(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (actor.role !== "broker" && actor.role !== "agent") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let parsed: z.infer<typeof patchSchema>;
  try {
    parsed = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!parsed.signing_platform && !parsed.signing_preferences) {
    return NextResponse.json({ error: "no_updates" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: contact, error: cErr } = await supabase
    .from("contacts")
    .select("id")
    .eq("tenant_id", actor.tenantId)
    .ilike("email", user.email.trim())
    .maybeSingle();

  if (cErr || !contact) {
    return NextResponse.json({ error: "broker_contact_not_found" }, { status: 404 });
  }

  const { data: bp, error: bpErr } = await supabase
    .from("broker_profiles")
    .select("id")
    .eq("tenant_id", actor.tenantId)
    .eq("contact_id", contact.id as string)
    .maybeSingle();

  if (bpErr || !bp) {
    return NextResponse.json({ error: "broker_profile_not_found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_by: actor.userId };
  if (parsed.signing_platform !== undefined) {
    updates.signing_platform = resolveSigningWorkflowSlug(parsed.signing_platform).slug;
  }
  if (parsed.signing_preferences !== undefined) {
    const mode =
      typeof parsed.signing_preferences.mode === "string"
        ? normalizeSigningDeliveryMode(parsed.signing_preferences.mode)
        : normalizeSigningDeliveryMode(null);
    updates.signing_preferences = {
      ...parsed.signing_preferences,
      mode,
      providerSlug:
        typeof updates.signing_platform === "string"
          ? updates.signing_platform
          : parsed.signing_preferences.providerSlug,
    };
  }

  const { error: upErr } = await supabase
    .from("broker_profiles")
    .update(updates)
    .eq("id", bp.id as string);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  await insertApiAudit(request, supabase, {
    tenantId: actor.tenantId,
    operation: "me.broker_profile_patch",
    detail: { broker_profile_id: bp.id, keys: Object.keys(updates) },
  });

  return NextResponse.json({ ok: true });
}
