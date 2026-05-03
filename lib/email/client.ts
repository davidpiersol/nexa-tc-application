/**
 * Postmark API — outbound templates + raw JSON email.
 * Server token: **`POSTMARK_SERVER_TOKEN`** (never hardcode).
 */
import { auditIntegrationAction } from "@/lib/integrations/audit";
import { fetchWithRetry } from "@/lib/integrations/fetch-with-retry";
import {
  IntegrationConfigError,
  IntegrationError,
} from "@/lib/integrations/errors";

const PROVIDER = "postmark";

function token(): string {
  const t = process.env.POSTMARK_SERVER_TOKEN?.trim();
  if (!t) throw new IntegrationConfigError(PROVIDER, "POSTMARK_SERVER_TOKEN missing");
  return t;
}

export type SendWithTemplateParams = {
  tenantId: string;
  From: string;
  To: string;
  TemplateId: number | string;
  TemplateModel: Record<string, unknown>;
  MessageStream?: string;
  actorId?: string | null;
};

/** https://postmarkapp.com/developer/api/templates-api#send-email-with-template */
export async function sendEmailWithTemplate(
  params: SendWithTemplateParams,
): Promise<{ MessageID: string }> {
  const res = await fetchWithRetry(
    "https://api.postmarkapp.com/email/withTemplate",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token(),
      },
      body: JSON.stringify({
        From: params.From,
        To: params.To,
        TemplateId: params.TemplateId,
        TemplateModel: params.TemplateModel,
        MessageStream: params.MessageStream ?? "outbound",
      }),
    },
    { maxRetries: 3 },
  );

  const text = await res.text();
  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "postmark.sendEmailWithTemplate",
    actorId: params.actorId,
    detail: { status: res.status, to: params.To, templateId: params.TemplateId },
  });

  if (!res.ok) {
    throw new IntegrationError(PROVIDER, "http_error", text, { status: res.status });
  }

  try {
    return JSON.parse(text) as { MessageID: string };
  } catch {
    throw new IntegrationError(PROVIDER, "validation_error", "Postmark response not JSON");
  }
}

export type SendEmailParams = {
  tenantId: string;
  From: string;
  To: string;
  Subject: string;
  HtmlBody?: string;
  TextBody?: string;
  MessageStream?: string;
  actorId?: string | null;
};

export async function sendEmail(params: SendEmailParams): Promise<{ MessageID: string }> {
  const res = await fetchWithRetry(
    "https://api.postmarkapp.com/email",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token(),
      },
      body: JSON.stringify({
        From: params.From,
        To: params.To,
        Subject: params.Subject,
        HtmlBody: params.HtmlBody,
        TextBody: params.TextBody,
        MessageStream: params.MessageStream ?? "outbound",
      }),
    },
    { maxRetries: 3 },
  );

  const text = await res.text();
  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "postmark.sendEmail",
    actorId: params.actorId,
    detail: { status: res.status, to: params.To },
  });

  if (!res.ok) {
    throw new IntegrationError(PROVIDER, "http_error", text, { status: res.status });
  }

  try {
    return JSON.parse(text) as { MessageID: string };
  } catch {
    throw new IntegrationError(PROVIDER, "validation_error", "Postmark response not JSON");
  }
}
