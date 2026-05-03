/**
 * Postmark **Inbound** webhook — attachments → Supabase Storage, optional Claude classification, audit + `email_ingestion` row.
 *
 * Configure Basic Auth on the inbound URL: **`POSTMARK_INBOUND_BASIC_USER`** / **`POSTMARK_INBOUND_BASIC_PASS`**.
 * Default tenant when routing cannot infer from address: **`POSTMARK_INBOUND_DEFAULT_TENANT_ID`** (uuid).
 * Storage bucket: **`SUPABASE_ATTACHMENTS_BUCKET`** (must exist; service role upload).
 */
import Anthropic from "@anthropic-ai/sdk";
import { auditIntegrationAction } from "@/lib/integrations/audit";
import { IntegrationConfigError } from "@/lib/integrations/errors";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const PROVIDER = "postmark_inbound";

export type PostmarkInboundPayload = {
  FromFull?: { Email?: string; Name?: string };
  From?: string;
  ToFull?: { Email?: string }[];
  To?: string;
  Subject?: string;
  TextBody?: string;
  HtmlBody?: string;
  StrippedTextReply?: string;
  MessageID?: string;
  Attachments?: Array<{
    Name?: string;
    Content?: string;
    ContentType?: string;
    ContentLength?: number;
  }>;
  Headers?: Array<{ Name?: string; Value?: string }>;
  OriginalRecipient?: string;
};

export function verifyPostmarkInboundBasicAuth(headerValue: string | null): boolean {
  const user = process.env.POSTMARK_INBOUND_BASIC_USER?.trim();
  const pass = process.env.POSTMARK_INBOUND_BASIC_PASS?.trim();
  if (!user || !pass) return false;
  if (!headerValue?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(headerValue.slice(6), "base64").toString("utf8");
  const idx = decoded.indexOf(":");
  const u = idx === -1 ? decoded : decoded.slice(0, idx);
  const p = idx === -1 ? "" : decoded.slice(idx + 1);
  return u === user && p === pass;
}

async function classifyAttachmentLabel(params: {
  fileName: string;
  mimeType: string;
  previewText: string;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return "unclassified";

  const client = new Anthropic({ apiKey: key });
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022",
    max_tokens: 120,
    messages: [
      {
        role: "user",
        content: `Label this email attachment for a real-estate transaction coordinator. Reply with exactly one short snake_case label (e.g. inspection_report, lender_cd, title_commitment, contract_addendum, other).\nFile: ${params.fileName}\nMIME: ${params.mimeType}\nSnippet:\n${params.previewText.slice(0, 4000)}`,
      },
    ],
  });
  const block = msg.content[0];
  if (block.type !== "text") return "unclassified";
  return block.text.trim().slice(0, 64) || "unclassified";
}

/**
 * Process Postmark Inbound JSON body (already parsed).
 */
export async function processPostmarkInbound(
  payload: PostmarkInboundPayload,
): Promise<{ ok: true; ingestionId: string; attachments: number }> {
  const tenantId =
    process.env.POSTMARK_INBOUND_DEFAULT_TENANT_ID?.trim() ||
    (() => {
      throw new IntegrationConfigError(
        PROVIDER,
        "POSTMARK_INBOUND_DEFAULT_TENANT_ID required",
      );
    })();

  const from =
    payload.FromFull?.Email ?? payload.From ?? "unknown@invalid";
  const subject = payload.Subject ?? "";
  const bodyPreview =
    (payload.StrippedTextReply ?? payload.TextBody ?? "").slice(0, 2000) ??
    "";

  const supabase = createServiceRoleClient();

  const { data: ingest, error: ingestErr } = await supabase
    .from("email_ingestion")
    .insert({
      tenant_id: tenantId,
      transaction_id: null,
      from_email: from,
      subject,
      body_preview: bodyPreview,
      raw_headers: payload as unknown as Record<string, unknown>,
      processed_at: null,
      matched_transaction_id: null,
    })
    .select("id")
    .single();

  if (ingestErr || !ingest?.id) {
    throw new Error(`email_ingestion insert failed: ${ingestErr?.message}`);
  }

  const bucket =
    process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";
  let uploaded = 0;

  for (const att of payload.Attachments ?? []) {
    if (!att.Content || !att.Name) continue;
    const buf = Buffer.from(att.Content, "base64");
    const path = `inbound/${tenantId}/${ingest.id}/${encodeURIComponent(att.Name)}`;

    const { error: upErr } = await supabase.storage.from(bucket).upload(path, buf, {
      contentType: att.ContentType ?? "application/octet-stream",
      upsert: true,
    });

    if (upErr) {
      await auditIntegrationAction({
        tenantId,
        provider: PROVIDER,
        operation: "postmark.inbound.upload_failed",
        detail: { error: upErr.message, path },
      });
      continue;
    }

    uploaded += 1;

    let label = "unclassified";
    try {
      label = await classifyAttachmentLabel({
        fileName: att.Name,
        mimeType: att.ContentType ?? "",
        previewText: bodyPreview,
      });
    } catch {
      label = "unclassified";
    }

    await auditIntegrationAction({
      tenantId,
      provider: PROVIDER,
      operation: "postmark.inbound.attachment",
      detail: {
        storagePath: path,
        label,
        messageId: payload.MessageID,
      },
    });
  }

  await supabase
    .from("email_ingestion")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", ingest.id);

  await auditIntegrationAction({
    tenantId,
    provider: PROVIDER,
    operation: "postmark.inbound.done",
    detail: { ingestionId: ingest.id, attachments: uploaded },
  });

  return { ok: true, ingestionId: ingest.id, attachments: uploaded };
}
