import { NextResponse, type NextRequest } from "next/server";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { requestAiFieldMappings } from "@/lib/documents/ai-mapping-suggestion";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

type Ctx = { params: { templateId: string; versionId: string } };

const VERSION_FIELDS =
  "id, template_id, fillable_field_names, field_mappings, mapping_review_status";

export async function GET(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  const { error } = await requireGlobalAdmin();
  if (error) return error;

  const admin = createServiceRoleClient();
  const { data: version, error: vErr } = await admin
    .from("global_document_template_versions")
    .select(VERSION_FIELDS)
    .eq("id", ctx.params.versionId)
    .eq("template_id", ctx.params.templateId)
    .maybeSingle();
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });
  if (!version) return NextResponse.json({ error: "version_not_found" }, { status: 404 });

  const { data: suggestions, error: sErr } = await admin
    .from("global_document_template_mapping_suggestions")
    .select(
      "id, template_version_id, suggested_mappings, confidence, status, model_name, rationale, created_by, reviewed_by, reviewed_at, created_at",
    )
    .eq("template_version_id", ctx.params.versionId)
    .order("created_at", { ascending: false });
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  return NextResponse.json({ version, suggestions: suggestions ?? [] });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const { actor, error } = await requireGlobalAdmin();
  if (error) return error;
  const current = actor!;

  const admin = createServiceRoleClient();
  const { data: version, error: vErr } = await admin
    .from("global_document_template_versions")
    .select(VERSION_FIELDS)
    .eq("id", ctx.params.versionId)
    .eq("template_id", ctx.params.templateId)
    .maybeSingle();
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });
  if (!version) return NextResponse.json({ error: "version_not_found" }, { status: 404 });

  const fillable = Array.isArray(version.fillable_field_names)
    ? version.fillable_field_names.filter((x: unknown) => typeof x === "string")
    : [];
  if (fillable.length === 0) {
    return NextResponse.json({ error: "no_fillable_fields" }, { status: 400 });
  }

  const existingMaps =
    version.field_mappings && typeof version.field_mappings === "object" && !Array.isArray(version.field_mappings)
      ? Object.keys(version.field_mappings as Record<string, unknown>).filter(
          (k) => String((version.field_mappings as Record<string, unknown>)[k]).trim(),
        )
      : [];
  if (existingMaps.length === 0) {
    return NextResponse.json(
      {
        error: "manual_mapping_required_first",
        message:
          "Save at least one manual field mapping before requesting AI suggestions.",
      },
      { status: 400 },
    );
  }

  await admin
    .from("global_document_template_mapping_suggestions")
    .update({ status: "superseded" })
    .eq("template_version_id", ctx.params.versionId)
    .eq("status", "pending");

  const ai = await requestAiFieldMappings({ pdfFieldNames: fillable as string[] });
  if (!ai.ok) {
    const status =
      ai.error.includes("ANTHROPIC_API_KEY") || ai.error.includes("missing") ? 503 : 400;
    return NextResponse.json({ error: "ai_failed", message: ai.error }, { status });
  }

  const { data: row, error: insErr } = await admin
    .from("global_document_template_mapping_suggestions")
    .insert({
      template_version_id: ctx.params.versionId,
      suggested_mappings: ai.mappings,
      confidence: ai.confidence,
      status: "pending",
      model_name: ai.modelName,
      rationale:
        ai.rationale ??
        `AI suggestion (${ai.mappings ? Object.keys(ai.mappings).length : 0} fields).`,
      created_by: current.userId,
    })
    .select(
      "id, template_version_id, suggested_mappings, confidence, status, model_name, rationale, created_at",
    )
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

  return NextResponse.json({
    ok: true,
    suggestion: row,
    preview: ai.rawTextPreview.slice(0, 500),
  });
}
