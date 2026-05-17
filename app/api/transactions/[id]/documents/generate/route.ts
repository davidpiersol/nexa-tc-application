import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isPrivilegedRole } from "@/lib/auth/roles";
import { fillPdfFromMappedFields } from "@/lib/documents/fill-pdf-acroform";
import { maxGenerationTemplateBytes } from "@/lib/documents/pdf-generation-limits";
import {
  buildStoredGenerationSnapshot,
  buildTransactionFieldSnapshot,
  listMissingMappedCanonicalFields,
} from "@/lib/documents/transaction-data-snapshot";
import type { TemplateFieldMappings } from "@/lib/documents/template-field-mapping";
import { isExpectedGlobalTemplateVersionPath } from "@/lib/documents/template-storage";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET =
  process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";

const bodySchema = z.object({
  selection_id: z.string().uuid(),
});

type Ctx = { params: { id: string } };

export async function POST(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPrivilegedRole(actor.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    const json = await request.json();
    parsed = bodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const transactionId = ctx.params.id;
  const admin = createServiceRoleClient();

  const { data: tx, error: txErr } = await admin
    .from("transactions")
    .select(
      "id, tenant_id, property_address, mls_number, close_date, notes, intake_data",
    )
    .eq("id", transactionId)
    .eq("tenant_id", actor.tenantId)
    .maybeSingle();

  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
  if (!tx) return NextResponse.json({ error: "transaction_not_found" }, { status: 404 });

  const { data: selection, error: selErr } = await admin
    .from("transaction_document_selections")
    .select("id, transaction_id, tenant_id, template_id, template_version_id")
    .eq("id", parsed.selection_id)
    .eq("transaction_id", transactionId)
    .eq("tenant_id", actor.tenantId)
    .maybeSingle();

  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
  if (!selection) return NextResponse.json({ error: "selection_not_found" }, { status: 404 });

  if (!selection.template_version_id) {
    return NextResponse.json({ error: "template_version_required" }, { status: 400 });
  }

  const { data: templateRow, error: tplErr } = await admin
    .from("global_document_templates")
    .select("id, form_number, category")
    .eq("id", selection.template_id)
    .maybeSingle();

  if (tplErr) return NextResponse.json({ error: tplErr.message }, { status: 500 });
  if (!templateRow) return NextResponse.json({ error: "template_not_found" }, { status: 404 });

  const { data: versionRow, error: verErr } = await admin
    .from("global_document_template_versions")
    .select(
      "id, template_id, storage_path, field_mappings, review_status, mapping_review_status, is_active",
    )
    .eq("id", selection.template_version_id)
    .maybeSingle();

  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });
  if (!versionRow) return NextResponse.json({ error: "template_version_not_found" }, { status: 404 });

  if (versionRow.template_id !== selection.template_id) {
    return NextResponse.json({ error: "template_version_mismatch" }, { status: 400 });
  }

  if (!versionRow.is_active) {
    return NextResponse.json({ error: "template_version_inactive" }, { status: 400 });
  }

  if (
    versionRow.review_status !== "approved" ||
    versionRow.mapping_review_status !== "approved"
  ) {
    return NextResponse.json({ error: "template_version_not_approved" }, { status: 400 });
  }

  if (
    !isExpectedGlobalTemplateVersionPath({
      storagePath: versionRow.storage_path,
      templateId: selection.template_id,
      versionId: selection.template_version_id,
    })
  ) {
    return NextResponse.json({ error: "invalid_template_storage_path" }, { status: 400 });
  }

  const fieldMappings = versionRow.field_mappings as TemplateFieldMappings;
  if (!fieldMappings || typeof fieldMappings !== "object" || Array.isArray(fieldMappings)) {
    return NextResponse.json({ error: "field_mappings_invalid" }, { status: 400 });
  }

  if (Object.keys(fieldMappings).length === 0) {
    return NextResponse.json({ error: "field_mappings_required" }, { status: 400 });
  }

  const snapshot = buildTransactionFieldSnapshot({
    property_address: tx.property_address,
    mls_number: tx.mls_number,
    close_date: tx.close_date,
    notes: tx.notes,
    intake_data: tx.intake_data,
  });

  const missing = listMissingMappedCanonicalFields(fieldMappings, snapshot);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "missing_mapped_data", missing_fields: missing },
      { status: 400 },
    );
  }

  const { data: templateFile, error: dlErr } = await admin.storage
    .from(BUCKET)
    .download(versionRow.storage_path);

  if (dlErr || !templateFile) {
    return NextResponse.json(
      { error: dlErr?.message ?? "template_download_failed" },
      { status: 500 },
    );
  }

  const maxBytes = maxGenerationTemplateBytes();
  const templateBytes = new Uint8Array(await templateFile.arrayBuffer());
  if (templateBytes.byteLength > maxBytes) {
    return NextResponse.json(
      { error: "template_pdf_too_large" },
      { status: 413 },
    );
  }

  let filledBytes: Uint8Array;
  try {
    filledBytes = await fillPdfFromMappedFields({
      templatePdfBytes: templateBytes,
      fieldMappings,
      snapshot,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "pdf_fill_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const ts = Date.now();
  const safeForm = sanitizeFilenameSegment(templateRow.form_number);
  const fileBase = `${ts}_${safeForm}.pdf`;
  const storagePath = `${actor.tenantId}/${transactionId}/generated/${fileBase}`;
  const buf = Buffer.from(filledBytes);

  const supabase = await createClient();
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const storedSnapshot = buildStoredGenerationSnapshot({
    templateId: templateRow.id,
    templateVersionId: versionRow.id,
    formNumber: templateRow.form_number,
    fieldSnapshot: snapshot,
  });

  const { data: docRow, error: insErr } = await supabase
    .from("documents")
    .insert({
      tenant_id: actor.tenantId,
      transaction_id: transactionId,
      uploaded_by: actor.userId,
      category: templateRow.category,
      status: "uploaded",
      file_name: fileBase,
      storage_path: storagePath,
      mime_type: "application/pdf",
      size_bytes: buf.byteLength,
      generated_from_template_version_id: versionRow.id,
      source_data_snapshot: storedSnapshot,
    })
    .select(
      "id, category, status, file_name, mime_type, created_at, storage_path, generated_from_template_version_id",
    )
    .single();

  if (insErr || !docRow) {
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => undefined);
    return NextResponse.json({ error: insErr?.message ?? "insert_failed" }, { status: 500 });
  }

  await insertApiAudit(request, supabase, {
    tenantId: actor.tenantId,
    transactionId,
    operation: "documents.generate_pdf",
    detail: {
      documentId: docRow.id,
      selectionId: selection.id,
      templateVersionId: versionRow.id,
      storagePath,
    },
  });

  return NextResponse.json({ document: docRow });
}

function sanitizeFilenameSegment(formNumber: string): string {
  const trimmed = formNumber.trim();
  const safe = trimmed.replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_");
  return safe.slice(0, 80) || "form";
}
