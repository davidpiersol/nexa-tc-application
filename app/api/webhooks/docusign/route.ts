import { NextResponse } from "next/server";
import {
  pickDocuSignSignatureHeader,
  verifyDocusignConnectHmac,
} from "@/lib/docusign/connect-verify";
import { downloadSignedDocument } from "@/lib/docusign/client";
import { auditIntegrationAction } from "@/lib/integrations/audit";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET =
  process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";

/**
 * DocuSign Connect — verify HMAC, audit, optionally pull signed doc when envelope completes.
 * Set **`DOCUSIGN_WEBHOOK_DEFAULT_TENANT_ID`** (uuid) + **`DOCUSIGN_WEBHOOK_HMAC_SECRET`** (or **`WEBHOOK_SECRET_DOCUSIGN`**).
 */
export async function POST(request: Request) {
  const raw = Buffer.from(await request.arrayBuffer());
  const sig = pickDocuSignSignatureHeader(request.headers);

  if (!verifyDocusignConnectHmac(raw, sig)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw.toString("utf8")) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data = (payload.Data ?? payload.data ?? {}) as Record<string, unknown>;
  const envelopeSummary = (data.EnvelopeSummary ?? data.envelopeSummary ?? {}) as Record<
    string,
    unknown
  >;
  const status = String(
    envelopeSummary.Status ??
      payload.Status ??
      payload.status ??
      payload.event ??
      "",
  );
  const envelopeId = String(
    envelopeSummary.EnvelopeId ??
      data.EnvelopeId ??
      payload.EnvelopeId ??
      payload.envelopeId ??
      "",
  );

  const tenantId = process.env.DOCUSIGN_WEBHOOK_DEFAULT_TENANT_ID?.trim();

  if (tenantId) {
    await auditIntegrationAction({
      tenantId,
      provider: "docusign_webhook",
      operation: "connect.event",
      detail: {
        status,
        envelopeId,
        event: payload.event ?? payload.Event,
      },
    });
  }

  const completed =
    status.toLowerCase() === "completed" ||
    String(payload.event ?? "").includes("envelope-completed");

  if (completed && envelopeId && tenantId) {
    try {
      const admin = createServiceRoleClient();
      const { data: doc } = await admin
        .from("documents")
        .select("id, transaction_id, tenant_id")
        .eq("tenant_id", tenantId)
        .eq("docusign_envelope_id", envelopeId)
        .maybeSingle();

      if (!doc) {
        console.warn("[webhooks/docusign] no document row for envelope", envelopeId);
      } else {
        const buf = await downloadSignedDocument({
          tenantId,
          envelopeId,
          documentId: process.env.DOCUSIGN_WEBHOOK_DOCUMENT_ID?.trim() ?? "1",
          actorId: null,
        });

        const path = `${doc.tenant_id}/${doc.transaction_id}/signed_${envelopeId}.pdf`;
        const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, {
          contentType: "application/pdf",
          upsert: true,
        });
        if (upErr) {
          console.warn("[webhooks/docusign] storage upload", upErr);
        }

        await admin
          .from("documents")
          .update({
            status: "approved",
            storage_path: path,
            updated_at: new Date().toISOString(),
          })
          .eq("id", doc.id);

        await admin
          .from("checklist_items")
          .update({
            completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq("linked_document_id", doc.id)
          .eq("tenant_id", tenantId);
      }
    } catch (e) {
      console.warn("[webhooks/docusign] completion pipeline", e);
    }
  }

  return NextResponse.json({ received: true });
}
