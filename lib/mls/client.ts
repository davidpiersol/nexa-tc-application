/**
 * RESO Web API (MLS) — OAuth 2.0 per tenant; secrets loaded from encrypted `api_integrations`.
 *
 * Env fallbacks (never hardcode endpoints in prod): `MLS_API_BASE_URL`, `MLS_CLIENT_ID`, `MLS_CLIENT_SECRET`,
 * `MLS_TOKEN_URL`, `MLS_SCOPE`.
 */
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

const PROVIDER = INTEGRATION_PROVIDERS.mls;

export type MlsTenantCredentials = {
  /** OData / RESO resource URL prefix, e.g. https://api.bridgedataoutput.com/api/v2/OData/xxx */
  apiBaseUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  accessToken?: string;
  refreshToken?: string;
  /** Epoch ms */
  accessTokenExpiresAt?: number;
};

function envOr<K extends keyof MlsTenantCredentials>(
  creds: MlsTenantCredentials | null,
  key: K,
  envKey: keyof NodeJS.ProcessEnv,
): string | undefined {
  const v = creds?.[key];
  if (typeof v === "string" && v.trim()) return v;
  const e = process.env[envKey as string];
  return e?.trim() || undefined;
}

async function ensureAccessToken(args: {
  tenantId: string;
  creds: MlsTenantCredentials | null;
  actorId?: string | null;
}): Promise<{ token: string; creds: MlsTenantCredentials }> {
  const merged: MlsTenantCredentials = {
    apiBaseUrl:
      envOr(args.creds, "apiBaseUrl", "MLS_API_BASE_URL") ??
      "",
    tokenUrl:
      envOr(args.creds, "tokenUrl", "MLS_TOKEN_URL") ??
      "",
    clientId:
      envOr(args.creds, "clientId", "MLS_CLIENT_ID") ??
      "",
    clientSecret:
      envOr(args.creds, "clientSecret", "MLS_CLIENT_SECRET") ??
      "",
    scope: envOr(args.creds, "scope", "MLS_SCOPE"),
    accessToken: args.creds?.accessToken,
    refreshToken: args.creds?.refreshToken,
    accessTokenExpiresAt: args.creds?.accessTokenExpiresAt,
  };

  if (!merged.apiBaseUrl || !merged.tokenUrl || !merged.clientId || !merged.clientSecret) {
    throw new IntegrationCredentialsError(
      PROVIDER,
      "MLS RESO credentials incomplete (apiBaseUrl, tokenUrl, clientId, clientSecret)",
    );
  }

  const now = Date.now();
  const slack = 60_000;
  if (
    merged.accessToken &&
    merged.accessTokenExpiresAt &&
    merged.accessTokenExpiresAt > now + slack
  ) {
    return { token: merged.accessToken, creds: merged };
  }

  const body = new URLSearchParams({
    grant_type: merged.refreshToken ? "refresh_token" : "client_credentials",
    client_id: merged.clientId,
    client_secret: merged.clientSecret,
  });
  if (merged.refreshToken) body.set("refresh_token", merged.refreshToken);
  if (merged.scope) body.set("scope", merged.scope);

  const res = await fetchWithRetry(
    merged.tokenUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    { maxRetries: 3 },
  );

  if (!res.ok) {
    const t = await res.text();
    await auditIntegrationAction({
      tenantId: args.tenantId,
      provider: PROVIDER,
      operation: "mls.oauth.token",
      actorId: args.actorId,
      detail: { status: res.status, body: t.slice(0, 500) },
    });
    throw new IntegrationError(PROVIDER, "oauth_error", `MLS token ${res.status}: ${t}`, {
      status: res.status,
    });
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  const expiresAt =
    typeof json.expires_in === "number"
      ? now + json.expires_in * 1000
      : now + 3600 * 1000;

  const updated: MlsTenantCredentials = {
    ...merged,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? merged.refreshToken,
    accessTokenExpiresAt: expiresAt,
  };

  await auditIntegrationAction({
    tenantId: args.tenantId,
    provider: PROVIDER,
    operation: "mls.oauth.token_ok",
    actorId: args.actorId,
    detail: { expiresAt },
  });

  return { token: json.access_token, creds: updated };
}

/** Exchange refresh token or client credentials — returns updated credential snapshot (persist externally). */
export async function refreshToken(params: {
  tenantId: string;
  actorId?: string | null;
}): Promise<MlsTenantCredentials> {
  const existing = await getTenantCredentials<MlsTenantCredentials>(
    params.tenantId,
    PROVIDER,
  );
  const { creds } = await ensureAccessToken({
    tenantId: params.tenantId,
    creds: existing,
    actorId: params.actorId,
  });
  return creds;
}

/** OData GET Property (or Media) — RESO shapes vary by vendor; returns parsed JSON. */
export async function getListingByMlsNumber(params: {
  tenantId: string;
  mlsNumber: string;
  actorId?: string | null;
}): Promise<unknown> {
  const existing = await getTenantCredentials<MlsTenantCredentials>(
    params.tenantId,
    PROVIDER,
  );
  const { token, creds } = await ensureAccessToken({
    tenantId: params.tenantId,
    creds: existing,
    actorId: params.actorId,
  });

  void creds; /* caller may persist refreshed tokens via upsertTenantCredentials */

  const base = envOr(creds, "apiBaseUrl", "MLS_API_BASE_URL");
  if (!base) {
    throw new IntegrationConfigError(PROVIDER, "MLS apiBaseUrl missing");
  }

  const filter = encodeURIComponent(`ListingId eq '${params.mlsNumber.replace(/'/g, "''")}'`);
  const url = `${base.replace(/\/$/, "")}/Property?$filter=${filter}&$top=1`;

  const res = await fetchWithRetry(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const bodyText = await res.text();
  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "mls.getListingByMlsNumber",
    actorId: params.actorId,
    detail: { mlsNumber: params.mlsNumber, status: res.status },
  });

  if (!res.ok) {
    throw new IntegrationError(PROVIDER, "http_error", bodyText, { status: res.status });
  }

  try {
    return JSON.parse(bodyText) as unknown;
  } catch {
    throw new IntegrationError(PROVIDER, "validation_error", "MLS listing response not JSON");
  }
}

/** Fetch Media rows linked to a listing `ListingKey` / `@odata.id` resource — vendor-specific filter. */
export async function getListingPhotos(params: {
  tenantId: string;
  listingKey: string;
  actorId?: string | null;
}): Promise<unknown> {
  const existing = await getTenantCredentials<MlsTenantCredentials>(
    params.tenantId,
    PROVIDER,
  );
  const { token, creds } = await ensureAccessToken({
    tenantId: params.tenantId,
    creds: existing,
    actorId: params.actorId,
  });
  void creds;

  const base = envOr(creds, "apiBaseUrl", "MLS_API_BASE_URL");
  if (!base) throw new IntegrationConfigError(PROVIDER, "MLS apiBaseUrl missing");

  const safeKey = params.listingKey.replace(/'/g, "''");
  const filter = encodeURIComponent(`ResourceRecordKey eq '${safeKey}'`);
  const url = `${base.replace(/\/$/, "")}/Media?$filter=${filter}`;

  const res = await fetchWithRetry(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const bodyText = await res.text();
  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "mls.getListingPhotos",
    actorId: params.actorId,
    detail: { listingKey: params.listingKey, status: res.status },
  });

  if (!res.ok) {
    throw new IntegrationError(PROVIDER, "http_error", bodyText, { status: res.status });
  }

  try {
    return JSON.parse(bodyText) as unknown;
  } catch {
    throw new IntegrationError(PROVIDER, "validation_error", "MLS media response not JSON");
  }
}
