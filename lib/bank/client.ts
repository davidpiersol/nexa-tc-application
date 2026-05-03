/**
 * Plaid — link token, token exchange, balance-based funds check.
 * Env: **`PLAID_CLIENT_ID`**, **`PLAID_SECRET`**, **`PLAID_ENV`** (`sandbox` | `development` | `production`).
 */
import { Products, CountryCode } from "plaid";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
} from "plaid";

import { auditIntegrationAction } from "@/lib/integrations/audit";
import {
  getTenantCredentials,
  INTEGRATION_PROVIDERS,
} from "@/lib/integrations/credentials-store";
import {
  IntegrationConfigError,
  IntegrationCredentialsError,
  IntegrationError,
} from "@/lib/integrations/errors";

const PROVIDER = INTEGRATION_PROVIDERS.plaid;

export type PlaidTenantCredentials = {
  clientId?: string;
  secret?: string;
  /** sandbox | development | production */
  env?: string;
};

function plaidClient(): PlaidApi {
  const clientId =
    process.env.PLAID_CLIENT_ID?.trim() ||
    (() => {
      throw new IntegrationConfigError(PROVIDER, "PLAID_CLIENT_ID missing");
    })();
  const secret =
    process.env.PLAID_SECRET?.trim() ||
    (() => {
      throw new IntegrationConfigError(PROVIDER, "PLAID_SECRET missing");
    })();

  const envName = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
  const basePath =
    envName === "production"
      ? PlaidEnvironments.production
      : envName === "development"
        ? PlaidEnvironments.development
        : PlaidEnvironments.sandbox;

  const config = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  return new PlaidApi(config);
}

async function clientForTenant(tenantId: string): Promise<PlaidApi> {
  const row = await getTenantCredentials<PlaidTenantCredentials>(
    tenantId,
    PROVIDER,
  );
  if (row?.clientId && row?.secret) {
    const envName = (row.env ?? process.env.PLAID_ENV ?? "sandbox").toLowerCase();
    const basePath =
      envName === "production"
        ? PlaidEnvironments.production
        : envName === "development"
          ? PlaidEnvironments.development
          : PlaidEnvironments.sandbox;
    const config = new Configuration({
      basePath,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": row.clientId,
          "PLAID-SECRET": row.secret,
        },
      },
    });
    return new PlaidApi(config);
  }
  return plaidClient();
}

export async function createLinkToken(params: {
  tenantId: string;
  userId: string;
  clientName?: string;
  products?: Products[];
  actorId?: string | null;
}): Promise<{ link_token: string; expiration: string }> {
  const plaid = await clientForTenant(params.tenantId);

  try {
    const res = await plaid.linkTokenCreate({
      user: { client_user_id: params.userId },
      client_name: params.clientName ?? "Nexa TC",
      products: params.products ?? [Products.Transactions, Products.Balance],
      country_codes: [CountryCode.Us],
      language: "en",
    });

    await auditIntegrationAction({
      tenantId: params.tenantId,
      provider: PROVIDER,
      operation: "plaid.createLinkToken",
      actorId: params.actorId,
      detail: { userId: params.userId },
    });

    const data = res.data;
    return { link_token: data.link_token, expiration: data.expiration };
  } catch (e: unknown) {
    const err = e as { response?: { data?: unknown } };
    throw new IntegrationError(
      PROVIDER,
      "provider_error",
      String(err?.response?.data ?? e),
      { cause: e },
    );
  }
}

export async function exchangePublicToken(params: {
  tenantId: string;
  publicToken: string;
  actorId?: string | null;
}): Promise<{ access_token: string; item_id: string }> {
  const plaid = await clientForTenant(params.tenantId);

  try {
    const res = await plaid.itemPublicTokenExchange({
      public_token: params.publicToken,
    });
    await auditIntegrationAction({
      tenantId: params.tenantId,
      provider: PROVIDER,
      operation: "plaid.exchangePublicToken",
      actorId: params.actorId,
      detail: { item_id: res.data.item_id },
    });
    return {
      access_token: res.data.access_token,
      item_id: res.data.item_id,
    };
  } catch (e: unknown) {
    throw new IntegrationError(
      PROVIDER,
      "provider_error",
      "itemPublicTokenExchange failed",
      { cause: e },
    );
  }
}

/**
 * Checks **available** balance on default depository account vs `minimumCents`.
 */
export async function verifyFundsAvailable(params: {
  tenantId: string;
  accessToken: string;
  /** Minimum balance required in **USD cents** */
  minimumCents: number;
  actorId?: string | null;
}): Promise<{ ok: boolean; availableCents: number }> {
  if (!params.accessToken?.trim()) {
    throw new IntegrationCredentialsError(PROVIDER, "Plaid access_token required");
  }

  const plaid = await clientForTenant(params.tenantId);

  try {
    const bal = await plaid.accountsBalanceGet({
      access_token: params.accessToken,
    });

    const accounts = bal.data.accounts;
    let availableCents = 0;
    for (const a of accounts) {
      const cur = a.balances.available ?? a.balances.current;
      if (cur != null && a.type === "depository") {
        availableCents = Math.max(availableCents, Math.round(cur * 100));
      }
    }

    const ok = availableCents >= params.minimumCents;

    await auditIntegrationAction({
      tenantId: params.tenantId,
      provider: PROVIDER,
      operation: "plaid.verifyFundsAvailable",
      actorId: params.actorId,
      detail: { ok, minimumCents: params.minimumCents, availableCents },
    });

    return { ok, availableCents };
  } catch (e: unknown) {
    throw new IntegrationError(
      PROVIDER,
      "provider_error",
      "accountsBalanceGet failed",
      { cause: e },
    );
  }
}
