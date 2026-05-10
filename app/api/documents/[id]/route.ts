import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createClient } from "@/lib/supabase/server";

const BUCKET =
  process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";

type Ctx = { params: { id: string } };

/**
 * Signed download URL for a document row — RLS must allow read; otherwise 403/404.
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { id } = ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const limited = await enforceApiRateLimit(request, user?.id);
  if (limited) return limited;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, storage_path, file_name, mime_type, tenant_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!doc?.storage_path) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 60);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: signErr?.message ?? "sign_failed" },
      { status: 403 },
    );
  }

  return NextResponse.json({
    url: signed.signedUrl,
    file_name: doc.file_name,
    mime_type: doc.mime_type,
  });
}

/**
 * Replace file payload for an existing document row (same document id, updated metadata).
 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const limited = await enforceApiRateLimit(request, user?.id);
  if (limited) return limited;

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: existing, error: existingErr } = await supabase
    .from("documents")
    .select("id, tenant_id, transaction_id, storage_path, file_name")
    .eq("id", id)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^\w.\-()\s]/g, "_").slice(0, 180);
  const nextPath = `${existing.tenant_id}/${existing.transaction_id}/${Date.now()}_${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(nextPath, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: updated, error: updateErr } = await supabase
    .from("documents")
    .update({
      storage_path: nextPath,
      file_name: safeName,
      mime_type: file.type || null,
      size_bytes: bytes.byteLength,
      status: "uploaded",
      uploaded_by: user.id,
    })
    .eq("id", id)
    .select("id, transaction_id, file_name, status")
    .single();

  if (updateErr || !updated) {
    await supabase.storage.from(BUCKET).remove([nextPath]).catch(() => undefined);
    return NextResponse.json(
      { error: updateErr?.message ?? "update_failed" },
      { status: 500 },
    );
  }

  if (existing.storage_path) {
    await supabase.storage.from(BUCKET).remove([existing.storage_path]).catch(() => undefined);
  }

  await insertApiAudit(request, supabase, {
    tenantId: existing.tenant_id,
    transactionId: existing.transaction_id,
    operation: "documents.revise",
    detail: { documentId: id, old_file_name: existing.file_name, new_file_name: safeName },
  });

  return NextResponse.json({ document: updated });
}

/**
 * Delete a document row and best-effort delete its stored file.
 */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { id } = ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const limited = await enforceApiRateLimit(request, user?.id);
  if (limited) return limited;

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: existing, error: existingErr } = await supabase
    .from("documents")
    .select("id, tenant_id, transaction_id, storage_path, file_name")
    .eq("id", id)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error: delErr } = await supabase.from("documents").delete().eq("id", id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  if (existing.storage_path) {
    await supabase.storage.from(BUCKET).remove([existing.storage_path]).catch(() => undefined);
  }

  await insertApiAudit(request, supabase, {
    tenantId: existing.tenant_id,
    transactionId: existing.transaction_id,
    operation: "documents.delete",
    detail: { documentId: id, file_name: existing.file_name },
  });

  return NextResponse.json({ ok: true });
}
