/**
 * DocuSign eSignature REST **v2.1** — **JWT Grant** via **`jose`** + **`fetch`** (no legacy SDK bundle).
 * Per-tenant overrides in `api_integrations` (`docusign`); env fallbacks for integration key, user id, RSA PEM.
 */
import { importPKCS8, SignJWT } from "jose";
import { auditIntegrationAction } from "@/lib/integrations/audit";
import {
  getTenantCredentials,
  INTEGRATION_PROVIDERS,
} from "@/lib/integrations/credentials-store";
import { fetchWithRetry } from "@/lib/integrations/fetch-with-retry";
import {
  IntegrationConfigError,
  IntegrationCredentialsError,
  IntegrationError,
} from "@/lib/integrations/errors";

const PROVIDER = INTEGRATION_PROVIDERS.docusign;

export type DocusignTenantCredentials = {
  integrationKey?: string;
  userId?: string;
  accountId?: string;
  rsaPrivateKeyPem?: string;
  oAuthBasePath?: string;
  restBasePath?: string;
};

function readRsaPem(): string {
  const raw = process.env.DOCUSIGN_RSA_PRIVATE_KEY;
  if (!raw?.trim()) {
    throw new IntegrationCredentialsError(
      PROVIDER,
      "DOCUSIGN_RSA_PRIVATE_KEY missing (PEM or base64-of-PEM)",
    );
  }
  const t = raw.trim();
  if (t.startsWith("-----BEGIN")) return t.replace(/\\n/g, "\n");
  try {
    return Buffer.from(t, "base64").toString("utf8");
  } catch {
    return t;
  }
}

async function getAccessContext(params: {
  tenantId: string;
  actorId?: string | null;
}): Promise<{
  accountId: string;
  accessToken: string;
  restBasePath: string;
  oAuthBasePath: string;
}> {
  const extra = await getTenantCredentials<DocusignTenantCredentials>(
    params.tenantId,
    PROVIDER,
  );

  const integrationKey =
    extra?.integrationKey?.trim() || process.env.DOCUSIGN_INTEGRATION_KEY?.trim();
  const userId = extra?.userId?.trim() || process.env.DOCUSIGN_USER_ID?.trim();
  const accountId = extra?.accountId?.trim() || process.env.DOCUSIGN_ACCOUNT_ID?.trim();
  const rsa = extra?.rsaPrivateKeyPem?.trim()
    ? extra.rsaPrivateKeyPem.replace(/\\n/g, "\n")
    : readRsaPem();

  if (!integrationKey || !userId || !accountId) {
    throw new IntegrationCredentialsError(
      PROVIDER,
      "DocuSign integrationKey, userId, and accountId required (env or tenant store)",
    );
  }

  const oAuthBasePath =
    extra?.oAuthBasePath?.trim() ||
    process.env.DOCUSIGN_OAUTH_BASE_PATH ||
    "account-d.docusign.com";
  const restBasePath =
    extra?.restBasePath?.trim() ||
    process.env.DOCUSIGN_REST_BASE_PATH ||
    "https://demo.docusign.net/restapi";

  let keyCrypto: CryptoKey;
  try {
    keyCrypto = await importPKCS8(rsa, "RS256");
  } catch {
    throw new IntegrationConfigError(PROVIDER, "DOCUSIGN_RSA_PRIVATE_KEY not valid PKCS8 PEM");
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({
    scope: "signature impersonation",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(integrationKey)
    .setSubject(userId)
    .setAudience(oAuthBasePath)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(keyCrypto);

  const tokenUrl = `https://${oAuthBasePath.replace(/^https?:\/\//, "").replace(/\/$/, "")}/oauth/token`;
  const tokenRes = await fetchWithRetry(
    tokenUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    },
    { maxRetries: 3 },
  );

  const tokenText = await tokenRes.text();
  if (!tokenRes.ok) {
    throw new IntegrationError(PROVIDER, "oauth_error", tokenText, { status: tokenRes.status });
  }

  const tokenJson = JSON.parse(tokenText) as { access_token: string };
  if (!tokenJson.access_token) {
    throw new IntegrationError(PROVIDER, "oauth_error", "no access_token in response");
  }

  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "docusign.jwt",
    actorId: params.actorId,
    detail: { accountId },
  });

  return {
    accountId,
    accessToken: tokenJson.access_token,
    restBasePath: restBasePath.replace(/\/$/, ""),
    oAuthBasePath,
  };
}

export async function createEnvelope(params: {
  tenantId: string;
  envelopeDefinition: Record<string, unknown>;
  actorId?: string | null;
}): Promise<{ envelopeId: string }> {
  const { accountId, accessToken, restBasePath } = await getAccessContext(params);

  const url = `${restBasePath}/v2.1/accounts/${encodeURIComponent(accountId)}/envelopes`;
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params.envelopeDefinition),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new IntegrationError(PROVIDER, "http_error", text, { status: res.status });
  }

  const json = JSON.parse(text) as { envelopeId?: string };
  if (!json.envelopeId) {
    throw new IntegrationError(PROVIDER, "validation_error", "missing envelopeId");
  }

  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "docusign.createEnvelope",
    actorId: params.actorId,
    detail: { envelopeId: json.envelopeId },
  });

  return { envelopeId: json.envelopeId };
}

export type DocusignRecipientStatus = {
  email: string | null;
  name: string | null;
  recipientId: string | null;
  status: string | null;
  deliveredDateTime: string | null;
  signedDateTime: string | null;
};

export async function getEnvelopeStatus(params: {
  tenantId: string;
  envelopeId: string;
  actorId?: string | null;
}): Promise<{
  envelopeId: string;
  status: string | null;
  statusChangedDateTime: string | null;
  recipients: DocusignRecipientStatus[];
}> {
  const { accountId, accessToken, restBasePath } = await getAccessContext(params);

  const base = `${restBasePath}/v2.1/accounts/${encodeURIComponent(accountId)}/envelopes/${encodeURIComponent(params.envelopeId)}`;
  const [envelopeRes, recipientsRes] = await Promise.all([
    fetchWithRetry(base, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }),
    fetchWithRetry(`${base}/recipients`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }),
  ]);

  const envelopeText = await envelopeRes.text();
  if (!envelopeRes.ok) {
    throw new IntegrationError(PROVIDER, "http_error", envelopeText, {
      status: envelopeRes.status,
    });
  }
  const recipientsText = await recipientsRes.text();
  if (!recipientsRes.ok) {
    throw new IntegrationError(PROVIDER, "http_error", recipientsText, {
      status: recipientsRes.status,
    });
  }

  const envelopeJson = JSON.parse(envelopeText) as {
    envelopeId?: string;
    status?: string | null;
    statusChangedDateTime?: string | null;
  };
  const recipientsJson = JSON.parse(recipientsText) as {
    signers?: Array<{
      email?: string | null;
      name?: string | null;
      recipientId?: string | null;
      status?: string | null;
      deliveredDateTime?: string | null;
      signedDateTime?: string | null;
    }>;
  };

  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "docusign.getEnvelopeStatus",
    actorId: params.actorId,
    detail: { envelopeId: params.envelopeId },
  });

  return {
    envelopeId: envelopeJson.envelopeId ?? params.envelopeId,
    status: envelopeJson.status ?? null,
    statusChangedDateTime: envelopeJson.statusChangedDateTime ?? null,
    recipients: (recipientsJson.signers ?? []).map((signer) => ({
      email: signer.email ?? null,
      name: signer.name ?? null,
      recipientId: signer.recipientId ?? null,
      status: signer.status ?? null,
      deliveredDateTime: signer.deliveredDateTime ?? null,
      signedDateTime: signer.signedDateTime ?? null,
    })),
  };
}

export async function getEmbeddedSigningUrl(params: {
  tenantId: string;
  envelopeId: string;
  recipientViewRequest: Record<string, unknown>;
  actorId?: string | null;
}): Promise<{ url: string }> {
  const { accountId, accessToken, restBasePath } = await getAccessContext(params);

  const url = `${restBasePath}/v2.1/accounts/${encodeURIComponent(accountId)}/envelopes/${encodeURIComponent(params.envelopeId)}/views/recipient`;
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params.recipientViewRequest),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new IntegrationError(PROVIDER, "http_error", text, { status: res.status });
  }

  const json = JSON.parse(text) as { url?: string };
  if (!json.url) {
    throw new IntegrationError(PROVIDER, "validation_error", "missing recipient view url");
  }

  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "docusign.getEmbeddedSigningUrl",
    actorId: params.actorId,
    detail: { envelopeId: params.envelopeId },
  });

  return { url: json.url };
}

export async function voidEnvelope(params: {
  tenantId: string;
  envelopeId: string;
  voidedReason: string;
  actorId?: string | null;
}): Promise<void> {
  const { accountId, accessToken, restBasePath } = await getAccessContext(params);

  const url = `${restBasePath}/v2.1/accounts/${encodeURIComponent(accountId)}/envelopes/${encodeURIComponent(params.envelopeId)}`;
  const res = await fetchWithRetry(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "voided",
      voidedReason: params.voidedReason,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new IntegrationError(PROVIDER, "http_error", t, { status: res.status });
  }

  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "docusign.voidEnvelope",
    actorId: params.actorId,
    detail: { envelopeId: params.envelopeId },
  });
}

export async function downloadSignedDocument(params: {
  tenantId: string;
  envelopeId: string;
  documentId: string;
  actorId?: string | null;
}): Promise<Buffer> {
  const { accountId, accessToken, restBasePath } = await getAccessContext(params);

  const url = `${restBasePath}/v2.1/accounts/${encodeURIComponent(accountId)}/envelopes/${encodeURIComponent(params.envelopeId)}/documents/${encodeURIComponent(params.documentId)}`;

  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const t = await res.text();
    throw new IntegrationError(PROVIDER, "http_error", t, { status: res.status });
  }

  const buf = Buffer.from(await res.arrayBuffer());

  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "docusign.downloadSignedDocument",
    actorId: params.actorId,
    detail: { envelopeId: params.envelopeId, documentId: params.documentId },
  });

  return buf;
}

export function getDocuSignRestBasePathFromEnv(): string {
  return process.env.DOCUSIGN_REST_BASE_PATH || "https://demo.docusign.net/restapi";
}

export function __requireConfigOrThrow() {
  if (!process.env.DOCUSIGN_INTEGRATION_KEY) {
    throw new IntegrationConfigError(PROVIDER, "DOCUSIGN_INTEGRATION_KEY");
  }
  readRsaPem();
}
