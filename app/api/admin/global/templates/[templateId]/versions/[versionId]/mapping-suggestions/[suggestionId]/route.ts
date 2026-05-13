import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { mergeApprovedSuggestionMappings } from "@/lib/documents/merge-mapping-suggestion";
import { persistDraftFieldMappings } from "@/lib/documents/persist-version-field-mappings";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

type Ctx = {
  params: { templateId: string; versionId: string; suggestionId: string };
};

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve_apply"),
    editedMappings: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    action: z.literal("reject"),
  }),
]);

const VERSION_FIELDS = "id, template_id, fillable_field_names";

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

  const { data: suggestion, error: sErr } = await admin
    .from("global_document_template_mapping_suggestions")
    .select("id, template_version_id, suggested_mappings, status")
    .eq("id", ctx.params.suggestionId)
    .eq("template_version_id", ctx.params.versionId)
    .maybeSingle();

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
  if (!suggestion) return NextResponse.json({ error: "suggestion_not_found" }, { status: 404 });
  if (suggestion.status !== "pending") {
    return NextResponse.json({ error: "suggestion_not_pending" }, { status: 400 });
  }

  if (parsed.data.action === "reject") {
    const { error: rErr } = await admin
      .from("global_document_template_mapping_suggestions")
      .update({
        status: "rejected",
        reviewed_by: current.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", ctx.params.suggestionId);
    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const baseMaps =
    suggestion.suggested_mappings &&
    typeof suggestion.suggested_mappings === "object" &&
    !Array.isArray(suggestion.suggested_mappings)
      ? { ...(suggestion.suggested_mappings as Record<string, string>) }
      : {};

  const merged = mergeApprovedSuggestionMappings(
    baseMaps,
    parsed.data.editedMappings,
  );

  const { data: version, error: vErr } = await admin
    .from("global_document_template_versions")
    .select(VERSION_FIELDS)
    .eq("id", ctx.params.versionId)
    .eq("template_id", ctx.params.templateId)
    .maybeSingle();

  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });
  if (!version) return NextResponse.json({ error: "version_not_found" }, { status: 404 });

  const saved = await persistDraftFieldMappings({
    admin,
    templateId: ctx.params.templateId,
    versionId: ctx.params.versionId,
    mappings: merged,
    fillableFieldNames: version.fillable_field_names,
    userId: current.userId,
  });

  if (!saved.ok) {
    return NextResponse.json(
      saved.error === "mapping_validation_error"
        ? { error: saved.error, details: saved.details }
        : { error: saved.error },
      { status: saved.status },
    );
  }

  const { error: apErr } = await admin
    .from("global_document_template_mapping_suggestions")
    .update({
      status: "approved",
      reviewed_by: current.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", ctx.params.suggestionId);

  if (apErr) return NextResponse.json({ error: apErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, version: saved.version });
}
