import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isPrivilegedRole } from "@/lib/auth/roles";
import { maxGenerationTemplateBytes } from "@/lib/documents/pdf-generation-limits";
import {
  buildPacketZip,
  dedupeDocumentIds,
  MAX_PACKET_DOCUMENTS,
  MAX_PACKET_RAW_BYTES,
} from "@/lib/documents/packet-zip";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET =
  process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";

const bodySchema = z.object({
  document_ids: z.array(z.string().uuid()).min(1),
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

  const documentIds = dedupeDocumentIds(parsed.document_ids);
  if (documentIds.length > MAX_PACKET_DOCUMENTS) {
    return NextResponse.json(
      { error: "too_many_documents", max: MAX_PACKET_DOCUMENTS },
      { status: 400 },
    );
  }

  const admin = createServiceRoleClient();

  const { data: tx, error: txErr } = await admin
    .from("transactions")
    .select("id, tenant_id, property_address")
    .eq("id", ctx.params.id)
    .eq("tenant_id", actor.tenantId)
    .maybeSingle();
  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
  if (!tx) return NextResponse.json({ error: "transaction_not_found" }, { status: 404 });

  const { data: rows, error: docErr } = await admin
    .from("documents")
    .select("id, file_name, storage_path, mime_type, size_bytes")
    .eq("transaction_id", ctx.params.id)
    .eq("tenant_id", actor.tenantId)
    .in("id", documentIds);
  if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 });

  if (!rows || rows.length !== documentIds.length) {
    return NextResponse.json({ error: "document_mismatch" }, { status: 400 });
  }

  let totalRaw = 0;
  const buffers: Array<{ name: string; data: Buffer }> = [];
  for (const id of documentIds) {
    const row = rows.find((r) => r.id === id);
    if (!row?.storage_path) {
      return NextResponse.json({ error: "document_missing_storage", document_id: id }, { status: 400 });
    }
    const sz = Number(row.size_bytes ?? 0);
    if (sz > maxGenerationTemplateBytes()) {
      return NextResponse.json({ error: "document_too_large", document_id: id }, { status: 413 });
    }
    totalRaw += sz;
    if (totalRaw > MAX_PACKET_RAW_BYTES) {
      return NextResponse.json({ error: "packet_too_large" }, { status: 413 });
    }

    const dl = await admin.storage.from(BUCKET).download(row.storage_path);
    if (dl.error || !dl.data) {
      return NextResponse.json({ error: dl.error?.message ?? "download_failed" }, { status: 500 });
    }
    const buf = Buffer.from(await dl.data.arrayBuffer());
    buffers.push({
      name: (row.file_name as string | null) ?? `${id}.pdf`,
      data: buf,
    });
  }

  let zip: Buffer;
  try {
    zip = await buildPacketZip(buffers);
  } catch {
    return NextResponse.json({ error: "zip_build_failed" }, { status: 500 });
  }

  const eventRows = documentIds.map((documentId) => ({
    tenant_id: actor.tenantId,
    transaction_id: ctx.params.id,
    document_id: documentId,
    event_kind: "packet_export" as const,
    signing_provider_slug: "zip_manual",
    detail: { packet_file_count: buffers.length },
    created_by: actor.userId,
  }));
  const { error: evErr } = await admin.from("document_workflow_events").insert(eventRows);
  if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });

  const slug = (tx.property_address ?? "transaction")
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const fname = `nexa-packet-${slug || "txn"}-${Date.now()}.zip`;

  const supabase = await createClient();
  await insertApiAudit(request, supabase, {
    tenantId: actor.tenantId,
    transactionId: ctx.params.id,
    operation: "documents.packet_export",
    detail: { document_ids: documentIds, bytes: zip.byteLength },
  });

  return new NextResponse(new Uint8Array(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "no-store",
    },
  });
}
