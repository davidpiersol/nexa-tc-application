import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

type Ctx = { params: { templateId: string; versionId: string } };

const patchSchema = z.object({
  action: z.enum(["approve_and_make_current", "set_current", "deactivate"]),
});

export async function PATCH(request: NextRequest, ctx: Ctx) {
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
  const { data: version, error: versionErr } = await admin
    .from("global_document_template_versions")
    .select("id, template_id")
    .eq("id", ctx.params.versionId)
    .eq("template_id", ctx.params.templateId)
    .maybeSingle();
  if (versionErr) return NextResponse.json({ error: versionErr.message }, { status: 500 });
  if (!version) return NextResponse.json({ error: "version_not_found" }, { status: 404 });

  if (
    parsed.data.action === "approve_and_make_current" ||
    parsed.data.action === "set_current"
  ) {
    const approve = parsed.data.action === "approve_and_make_current";
    const { error: clearErr } = await admin
      .from("global_document_template_versions")
      .update({ is_current: false, updated_by: current.userId })
      .eq("template_id", ctx.params.templateId);
    if (clearErr) return NextResponse.json({ error: clearErr.message }, { status: 400 });

    const updatePayload: Record<string, unknown> = {
      is_current: true,
      is_active: true,
      updated_by: current.userId,
    };
    if (approve) updatePayload.review_status = "approved";

    const { data, error: applyErr } = await admin
      .from("global_document_template_versions")
      .update(updatePayload)
      .eq("id", ctx.params.versionId)
      .eq("template_id", ctx.params.templateId)
      .select("id, template_id, version_label, review_status, is_current, is_active, updated_at")
      .single();
    if (applyErr) return NextResponse.json({ error: applyErr.message }, { status: 400 });
    return NextResponse.json({ ok: true, version: data });
  }

  const { data, error: deactivateErr } = await admin
    .from("global_document_template_versions")
    .update({
      is_active: false,
      is_current: false,
      updated_by: current.userId,
    })
    .eq("id", ctx.params.versionId)
    .eq("template_id", ctx.params.templateId)
    .select("id, template_id, version_label, review_status, is_current, is_active, updated_at")
    .single();
  if (deactivateErr) return NextResponse.json({ error: deactivateErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, version: data });
}
