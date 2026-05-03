/**
 * ATTOM Data / property intelligence — **not** Clerk auth; path `lib/clerk` is from the build guide name.
 * REST API with **API key** (per-tenant in `api_integrations` or `ATTOM_API_KEY` env).
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

const PROVIDER = INTEGRATION_PROVIDERS.attom;

export type AttomTenantCredentials = {
  apiKey: string;
  /** Default https://api.gateway.attomdata.com/propertyapi/v1.0.0 */
  baseUrl?: string;
};

function resolveCredentials(
  tenantId: string,
): Promise<AttomTenantCredentials | null> {
  return getTenantCredentials<AttomTenantCredentials>(tenantId, PROVIDER);
}

function apiKey(creds: AttomTenantCredentials | null): string {
  const k = creds?.apiKey?.trim() || process.env.ATTOM_API_KEY?.trim();
  if (!k) {
    throw new IntegrationCredentialsError(
      PROVIDER,
      "ATTOM apiKey missing (tenant credentials or ATTOM_API_KEY)",
    );
  }
  return k;
}

function baseUrl(creds: AttomTenantCredentials | null): string {
  const u =
    creds?.baseUrl?.trim() ||
    process.env.ATTOM_API_BASE_URL?.trim() ||
    "https://api.gateway.attomdata.com/propertyapi/v1.0.0";
  return u.replace(/\/$/, "");
}

/** Normalized single-line address query for ATTOM search endpoints. */
export async function getPropertyByAddress(params: {
  tenantId: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  actorId?: string | null;
}): Promise<unknown> {
  const creds = await resolveCredentials(params.tenantId);
  const key = apiKey(creds);
  const root = baseUrl(creds);

  const qs = new URLSearchParams({
    address1: params.line1,
    postalcode: params.postalCode,
  });
  qs.set("apikey", key);

  const url = `${root}/property/detail?${qs.toString()}`;

  const res = await fetchWithRetry(url, {
    headers: { Accept: "application/json" },
  });

  const text = await res.text();
  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "attom.getPropertyByAddress",
    actorId: params.actorId,
    detail: { status: res.status, city: params.city, state: params.state },
  });

  if (!res.ok) {
    throw new IntegrationError(PROVIDER, "http_error", text, { status: res.status });
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new IntegrationError(PROVIDER, "validation_error", "ATTOM response not JSON");
  }
}

/** Owner / expanded attribution where ATTOM exposes `expandedprofile` or party endpoints (vendor-specific). */
export async function getOwnerInfo(params: {
  tenantId: string;
  /** ATTOM property id / attom id from prior responses */
  attomId: string;
  actorId?: string | null;
}): Promise<unknown> {
  if (!params.attomId.trim()) {
    throw new IntegrationConfigError(PROVIDER, "attomId required");
  }

  const creds = await resolveCredentials(params.tenantId);
  const key = apiKey(creds);
  const root = baseUrl(creds);

  const qs = new URLSearchParams({ apikey: key });
  const url = `${root}/property/expandedprofile/${encodeURIComponent(params.attomId)}?${qs}`;

  const res = await fetchWithRetry(url, { headers: { Accept: "application/json" } });
  const text = await res.text();

  await auditIntegrationAction({
    tenantId: params.tenantId,
    provider: PROVIDER,
    operation: "attom.getOwnerInfo",
    actorId: params.actorId,
    detail: { status: res.status, attomId: params.attomId },
  });

  if (!res.ok) {
    throw new IntegrationError(PROVIDER, "http_error", text, { status: res.status });
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new IntegrationError(PROVIDER, "validation_error", "ATTOM response not JSON");
  }
}
