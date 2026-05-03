import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createClient } from "@/lib/supabase/server";

const BUCKET =
  process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const limited = await enforceApiRateLimit(request, user?.id);
  if (limited) return limited;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const transactionId = request.nextUrl.searchParams.get("transaction_id");
  if (!transactionId) {
    return NextResponse.json({ error: "transaction_id_required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, category, status, file_name, mime_type, size_bytes, created_at, updated_at, transaction_id",
    )
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data ?? [] });
}

export async function POST(request: NextRequest) {
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

  const { data: tenantRow } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!tenantRow?.tenant_id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const transactionId = String(form.get("transaction_id") ?? "");
  const category = String(form.get("category") ?? "other") as
    | "contract"
    | "disclosure"
    | "title"
    | "mortgage"
    | "inspection"
    | "hoa"
    | "other";
  const file = form.get("file");
  if (!transactionId || !(file instanceof File)) {
    return NextResponse.json(
      { error: "transaction_id_and_file_required" },
      { status: 400 },
    );
  }

  const safeName = file.name.replace(/[^\w.\-()\s]/g, "_").slice(0, 180);
  const path = `${tenantRow.tenant_id}/${transactionId}/${Date.now()}_${safeName}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: row, error: insErr } = await supabase
    .from("documents")
    .insert({
      tenant_id: tenantRow.tenant_id,
      transaction_id: transactionId,
      uploaded_by: user.id,
      category,
      status: "uploaded",
      file_name: safeName,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: buf.byteLength,
    })
    .select("id, status, file_name, category, created_at")
    .single();

  if (insErr || !row) {
    return NextResponse.json({ error: insErr?.message ?? "insert_failed" }, { status: 500 });
  }

  await insertApiAudit(request, supabase, {
    tenantId: tenantRow.tenant_id,
    transactionId,
    operation: "documents.upload",
    detail: { documentId: row.id, path },
  });

  return NextResponse.json({ document: row });
}
