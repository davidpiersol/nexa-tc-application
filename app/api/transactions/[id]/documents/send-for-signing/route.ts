import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isPrivilegedRole } from "@/lib/auth/roles";
import { maxGenerationTemplateBytes } from "@/lib/documents/pdf-generation-limits";
import { dedupeDocumentIds, MAX_PACKET_DOCUMENTS, MAX_PACKET_RAW_BYTES } from "@/lib/documents/packet-zip";
import { createEnvelope } from "@/lib/docusign/client";
import { resolveSigningPreferenceForTransaction } from "@/lib/signing/broker-signing-preference";
import { envelopeFileExtension } from "@/lib/signing/envelope-file-extension";
import { SIGNING_PROVIDER_SLUG } from "@/lib/signing/signing-workflow";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET =
  process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";

const bodySchema = z.object({
  document_ids: z.array(z.string().uuid()).min(1),
  signer_email: z.string().trim().email().optional(),
  signer_name: z.string().trim().max(240).optional(),
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
    .select("id, tenant_id, property_address, archived_at")
    .eq("id", ctx.params.id)
    .eq("tenant_id", actor.tenantId)
    .maybeSingle();
  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
  if (!tx) return NextResponse.json({ error: "transaction_not_found" }, { status: 404 });
  if (tx.archived_at) {
    return NextResponse.json({ error: "archived_transaction_read_only" }, { status: 400 });
  }

  const { workflow: preference } = await resolveSigningPreferenceForTransaction({
    admin,
    tenantId: actor.tenantId,
    transactionId: ctx.params.id,
  });

  const { data: actorUser } = await admin
    .from("users")
    .select("email, full_name")
    .eq("id", actor.userId)
    .maybeSingle();

  const signerEmail =
    parsed.signer_email?.trim() ??
    (typeof actorUser?.email === "string" ? actorUser.email.trim() : "");
  const signerName =
    parsed.signer_name?.trim() ??
    (typeof actorUser?.full_name === "string" && actorUser.full_name.trim()
      ? actorUser.full_name.trim()
      : signerEmail.split("@")[0] ?? "Signer");

  if (!signerEmail) {
    return NextResponse.json({ error: "signer_email_required" }, { status: 400 });
  }

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
  type DocBinary = { id: string; base64: string; name: string };
  const docBins: DocBinary[] = [];

  for (let i = 0; i < documentIds.length; i++) {
    const id = documentIds[i]!;
    const row = rows.find((r) => r.id === id)!;
    if (!row.storage_path) {
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

    const dl = await admin.storage.from(BUCKET).download(row.storage_path as string);
    if (dl.error || !dl.data) {
      return NextResponse.json({ error: dl.error?.message ?? "download_failed" }, { status: 500 });
    }

    const buf = Buffer.from(await dl.data.arrayBuffer());
    docBins.push({
      id,
      base64: buf.toString("base64"),
      name: ((row.file_name as string | null) ?? `document-${i + 1}.pdf`).replace(
        /[^\w.\-()\s]/g,
        "_",
      ),
    });
  }

  const nowIso = new Date().toISOString();
  let executedSlug: (typeof SIGNING_PROVIDER_SLUG)[keyof typeof SIGNING_PROVIDER_SLUG] =
    SIGNING_PROVIDER_SLUG.neutralManual;
  let envelopeId: string | null = null;
  let failureDetail: string | null = null;

  if (preference.slug === SIGNING_PROVIDER_SLUG.docusignApi) {
    try {
      const documents = docBins.map((d, idx) => {
        const row = rows.find((r) => r.id === d.id)!;
        return {
          documentBase64: d.base64,
          name: d.name,
          fileExtension: envelopeFileExtension({
            mimeType: row.mime_type as string | null | undefined,
            fileName: d.name,
          }),
          documentId: String(idx + 1),
        };
      });

      const envelopeDefinition: Record<string, unknown> = {
        emailSubject: `Sign documents (${(tx.property_address as string | null) ?? "transaction"})`,
        emailBlurb: "Please review and sign the attached documents.",
        status: "sent",
        documents,
        recipients: {
          signers: [
            {
              email: signerEmail,
              name: signerName,
              recipientId: "1",
              routingOrder: "1",
            },
          ],
        },
      };

      const created = await createEnvelope({
        tenantId: actor.tenantId,
        envelopeDefinition,
        actorId: actor.userId,
      });
      envelopeId = created.envelopeId;
      executedSlug = SIGNING_PROVIDER_SLUG.docusignApi;
    } catch (e) {
      failureDetail = e instanceof Error ? e.message : String(e);
      executedSlug = SIGNING_PROVIDER_SLUG.neutralManual;
    }
  }

  const eventSlug: (typeof SIGNING_PROVIDER_SLUG)[keyof typeof SIGNING_PROVIDER_SLUG] =
    executedSlug === SIGNING_PROVIDER_SLUG.docusignApi && envelopeId
      ? SIGNING_PROVIDER_SLUG.docusignApi
      : SIGNING_PROVIDER_SLUG.neutralManual;

  const { error: upErr } = await admin
    .from("documents")
    .update({
      status: "sent_for_signature",
      updated_at: nowIso,
      ...(envelopeId ? { docusign_envelope_id: envelopeId } : {}),
    })
    .eq("transaction_id", ctx.params.id)
    .eq("tenant_id", actor.tenantId)
    .in("id", documentIds);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const detailBase = {
    signer_email: signerEmail,
    signer_name: signerName,
    preferred_provider: preference.slug,
    envelope_id: envelopeId,
    executed_provider: eventSlug,
    ...(failureDetail ? { fallback_reason: failureDetail.slice(0, 2000) } : {}),
  };

  const events = documentIds.map((documentId) => ({
    tenant_id: actor.tenantId,
    transaction_id: ctx.params.id,
    document_id: documentId,
    event_kind: "sent_for_signature" as const,
    signing_provider_slug: eventSlug,
    detail: detailBase,
    created_by: actor.userId,
  }));

  const { error: evErr } = await admin.from("document_workflow_events").insert(events);
  if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });

  const supabase = await createClient();
  await insertApiAudit(request, supabase, {
    tenantId: actor.tenantId,
    transactionId: ctx.params.id,
    operation: "documents.send_for_signing",
    detail: {
      document_ids: documentIds,
      executed_provider: eventSlug,
      envelope_id: envelopeId,
    },
  });

  const executed_provider =
    executedSlug === SIGNING_PROVIDER_SLUG.docusignApi && envelopeId
      ? SIGNING_PROVIDER_SLUG.docusignApi
      : SIGNING_PROVIDER_SLUG.neutralManual;

  return NextResponse.json({
    ok: true,
    preferred_provider: preference.slug,
    executed_provider,
    envelope_id: envelopeId,
    ...(preference.slug === SIGNING_PROVIDER_SLUG.docusignApi &&
    executed_provider === SIGNING_PROVIDER_SLUG.neutralManual &&
    failureDetail
      ? { manual_hint: failureDetail }
      : {}),
  });
}
