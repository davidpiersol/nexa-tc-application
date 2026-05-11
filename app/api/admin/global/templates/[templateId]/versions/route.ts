import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { detectPdfFieldNames } from "@/lib/documents/pdf-fields";
import { buildGlobalTemplateStoragePath } from "@/lib/documents/template-storage";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const BUCKET = process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";

type Ctx = { params: { templateId: string } };

export async function POST(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const { actor, error } = await requireGlobalAdmin();
  if (error) return error;
  const current = actor!;

  const form = await request.formData();
  const file = form.get("file");
  const versionLabelRaw = String(form.get("versionLabel") ?? "").trim();
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  if (!versionLabelRaw) {
    return NextResponse.json({ error: "version_label_required" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "pdf_required" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: template, error: templateErr } = await admin
    .from("global_document_templates")
    .select("id")
    .eq("id", ctx.params.templateId)
    .maybeSingle();
  if (templateErr) return NextResponse.json({ error: templateErr.message }, { status: 500 });
  if (!template) return NextResponse.json({ error: "template_not_found" }, { status: 404 });

  const versionId = randomUUID();
  const storagePath = buildGlobalTemplateStoragePath({
    templateId: ctx.params.templateId,
    versionId,
    sourceFileName: file.name,
  });
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  let fieldNames: string[] = [];
  try {
    fieldNames = await detectPdfFieldNames(bytes);
  } catch {
    fieldNames = [];
  }

  const { data, error: insertErr } = await admin
    .from("global_document_template_versions")
    .insert({
      id: versionId,
      template_id: ctx.params.templateId,
      version_label: versionLabelRaw,
      source_file_name: file.name,
      storage_path: storagePath,
      fillable_field_names: fieldNames,
      field_mappings: {},
      review_status: "needs_review",
      mapping_review_status: "needs_review",
      is_current: false,
      is_active: true,
      created_by: current.userId,
      updated_by: current.userId,
    })
    .select(
      "id, template_id, version_label, review_status, mapping_review_status, is_current, source_file_name, storage_path, fillable_field_names, field_mappings, created_at",
    )
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, version: data });
}
