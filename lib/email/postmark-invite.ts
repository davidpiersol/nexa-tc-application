/**
 * Postmark transactional send — invite acceptance link.
 * Uses REST API; requires `POSTMARK_SERVER_TOKEN` and `EMAIL_FROM`.
 */
export async function sendInviteEmail(params: {
  to: string;
  inviteUrl: string;
  /** Display name of inviter or team */
  inviterLabel?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.EMAIL_FROM;
  if (!token || !from) {
    console.warn("Postmark not configured — invite email skipped");
    return { ok: false, error: "email_not_configured" };
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: from,
      To: params.to,
      Subject: "You’re invited to Nexa TC",
      HtmlBody: `<p>You’ve been invited${params.inviterLabel ? ` by ${params.inviterLabel}` : ""}.</p><p><a href="${params.inviteUrl}">Accept invitation</a></p>`,
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text };
  }
  return { ok: true };
}
