import type { SupabaseClient } from "@supabase/supabase-js";
import { validateTemplateFieldMappings } from "@/lib/documents/template-field-mapping";

export const VERSION_MAPPING_SELECT_COLUMNS =
  "id, template_id, version_label, review_status, mapping_review_status, is_current, is_active, fillable_field_names, field_mappings, updated_at";

export async function persistDraftFieldMappings(params: {
  admin: SupabaseClient;
  templateId: string;
  versionId: string;
  mappings: Record<string, string>;
  fillableFieldNames: unknown;
  userId: string;
}): Promise<
  | { ok: true; version: Record<string, unknown> }
  | { ok: false; status: number; error: string; details?: string[] }
> {
  const validated = validateTemplateFieldMappings(params.mappings, params.fillableFieldNames);
  if (validated.errors.length) {
    return {
      ok: false,
      status: 400,
      error: "mapping_validation_error",
      details: validated.errors,
    };
  }

  const { data, error: saveErr } = await params.admin
    .from("global_document_template_versions")
    .update({
      field_mappings: validated.normalized,
      review_status: "needs_review",
      mapping_review_status: "needs_review",
      mapping_reviewed_by: null,
      mapping_reviewed_at: null,
      is_current: false,
      updated_by: params.userId,
    })
    .eq("id", params.versionId)
    .eq("template_id", params.templateId)
    .select(VERSION_MAPPING_SELECT_COLUMNS)
    .single();

  if (saveErr) {
    return { ok: false, status: 400, error: saveErr.message };
  }

  return { ok: true, version: data as Record<string, unknown> };
}
