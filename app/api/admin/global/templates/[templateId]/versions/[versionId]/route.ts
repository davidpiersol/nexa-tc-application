import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import {
  canVersionBecomeCurrent,
  validateTemplateFieldMappings,
} from "@/lib/documents/template-field-mapping";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

type Ctx = { params: { templateId: string; versionId: string } };

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save_mappings"),
    mappings: z.record(z.string(), z.string()),
  }),
  z.object({
    action: z.literal("approve_mappings"),
  }),
  z.object({
    action: z.literal("approve_and_make_current"),
  }),
  z.object({
    action: z.literal("set_current"),
  }),
  z.object({
    action: z.literal("deactivate"),
  }),
]);

const SELECT_COLUMNS =
  "id, template_id, version_label, review_status, mapping_review_status, is_current, is_active, fillable_field_names, field_mappings, updated_at";

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
    .select(SELECT_COLUMNS)
    .eq("id", ctx.params.versionId)
    .eq("template_id", ctx.params.templateId)
    .maybeSingle();
  if (versionErr) return NextResponse.json({ error: versionErr.message }, { status: 500 });
  if (!version) return NextResponse.json({ error: "version_not_found" }, { status: 404 });

  if (parsed.data.action === "save_mappings") {
    const validated = validateTemplateFieldMappings(
      parsed.data.mappings,
      version.fillable_field_names,
    );
    if (validated.errors.length) {
      return NextResponse.json(
        { error: "mapping_validation_error", details: validated.errors },
        { status: 400 },
      );
    }

    const { data, error: saveErr } = await admin
      .from("global_document_template_versions")
      .update({
        field_mappings: validated.normalized,
        review_status: "needs_review",
        mapping_review_status: "needs_review",
        mapping_reviewed_by: null,
        mapping_reviewed_at: null,
        is_current: false,
        updated_by: current.userId,
      })
      .eq("id", ctx.params.versionId)
      .eq("template_id", ctx.params.templateId)
      .select(SELECT_COLUMNS)
      .single();
    if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 400 });
    return NextResponse.json({ ok: true, version: data });
  }

  if (parsed.data.action === "approve_mappings") {
    const currentMappings =
      version.field_mappings && typeof version.field_mappings === "object"
        ? (version.field_mappings as Record<string, string>)
        : {};
    const mappedCount = Object.keys(currentMappings).length;
    const hasFillableFields =
      Array.isArray(version.fillable_field_names) && version.fillable_field_names.length > 0;
    if (hasFillableFields && mappedCount === 0) {
      return NextResponse.json({ error: "mappings_required_before_approval" }, { status: 400 });
    }

    const { data, error: approveErr } = await admin
      .from("global_document_template_versions")
      .update({
        review_status: "approved",
        mapping_review_status: "approved",
        mapping_reviewed_by: current.userId,
        mapping_reviewed_at: new Date().toISOString(),
        updated_by: current.userId,
      })
      .eq("id", ctx.params.versionId)
      .eq("template_id", ctx.params.templateId)
      .select(SELECT_COLUMNS)
      .single();
    if (approveErr) return NextResponse.json({ error: approveErr.message }, { status: 400 });
    return NextResponse.json({ ok: true, version: data });
  }

  if (
    parsed.data.action === "approve_and_make_current" ||
    parsed.data.action === "set_current"
  ) {
    const approve = parsed.data.action === "approve_and_make_current";
    const canPromote = canVersionBecomeCurrent({
      reviewStatus: approve ? "approved" : version.review_status,
      mappingReviewStatus: approve ? "approved" : version.mapping_review_status,
    });
    if (!canPromote) {
      return NextResponse.json(
        {
          error: "mapping_review_incomplete",
          message: "Approve mappings before making this version current.",
        },
        { status: 400 },
      );
    }

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
    if (approve) {
      updatePayload.review_status = "approved";
      updatePayload.mapping_review_status = "approved";
      updatePayload.mapping_reviewed_by = current.userId;
      updatePayload.mapping_reviewed_at = new Date().toISOString();
    }

    const { data, error: applyErr } = await admin
      .from("global_document_template_versions")
      .update(updatePayload)
      .eq("id", ctx.params.versionId)
      .eq("template_id", ctx.params.templateId)
      .select(SELECT_COLUMNS)
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
    .select(SELECT_COLUMNS)
    .single();
  if (deactivateErr) return NextResponse.json({ error: deactivateErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, version: data });
}
