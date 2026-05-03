/**
 * DocuSign Connect HMAC verification (`DOCUSIGN_WEBHOOK_HMAC_SECRET`).
 * Compare **base64** HMAC-SHA256 of the **raw** request body to the signature header.
 */
import crypto from "node:crypto";

/** DocuSign Connect may send `X-DocuSign-Signature-1` or `x-docusign-signature-1`. */
export function pickDocuSignSignatureHeader(headers: Headers): string | null {
  return (
    headers.get("X-DocuSign-Signature-1") ??
    headers.get("x-docusign-signature-1") ??
    null
  );
}

export function verifyDocusignConnectHmac(
  rawBody: Buffer | string,
  signatureHeader: string | null | undefined,
): boolean {
  const secret =
    process.env.DOCUSIGN_WEBHOOK_HMAC_SECRET?.trim() ??
    process.env.WEBHOOK_SECRET_DOCUSIGN?.trim();
  if (!secret || !signatureHeader?.trim()) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(typeof rawBody === "string" ? rawBody : rawBody);
  const expected = hmac.digest("base64");
  const got = signatureHeader.trim();

  try {
    const a = Buffer.from(expected, "base64");
    const b = Buffer.from(got, "base64");
    if (a.length !== b.length) {
      return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(got, "utf8"));
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(got, "utf8"));
  }
}
