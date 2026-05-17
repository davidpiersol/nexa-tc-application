import { randomUUID } from "node:crypto";
import { sendEmail } from "@/lib/email/client";
import { signInviteToken } from "@/lib/invite/jwt";

export async function sendWorkspaceInvite(params: {
  tenantId: string; actorId: string; email: string; role: string; tenantName?: string;
}) {
  const token = await signInviteToken({ email: params.email, tenant_id: params.tenantId, role: params.role, jti: randomUUID() });
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const href = `${base}/invite/${token}`;
  await sendEmail({
    tenantId: params.tenantId,
    actorId: params.actorId,
    From: process.env.EMAIL_FROM ?? "",
    To: params.email,
    Subject: `You're invited to Choral Point${params.tenantName ? ` for ${params.tenantName}` : ""}`,
    TextBody: `You have been invited to Choral Point. Set up your account here: ${href}`,
    HtmlBody: `<p>You have been invited to Choral Point.</p><p><a href="${href}">Set up your account</a></p>`,
  });
}
