/**
 * Persist encrypted tenant credentials in `api_integrations.credentials_json`.
 * Plain shape stored at rest: `{ v: 1, cipher: "aes-256-gcm", blob: "<base64>" }`.
 */
import {
  decryptCredentialsPayload,
  encryptCredentialsPayload,
} from "@/lib/integrations/crypto";
import {
  IntegrationCredentialsError,
  IntegrationError,
} from "@/lib/integrations/errors";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const INTEGRATION_PROVIDERS = {
  mls: "mls",
  attom: "attom",
  docusign: "docusign",
  postmark: "postmark",
  plaid: "plaid",
  aiOpenai: "ai_openai",
  aiAnthropic: "ai_anthropic",
  aiGoogleGemini: "ai_google_gemini",
  aiGoogleVertex: "ai_google_vertex",
  aiOpenrouter: "ai_openrouter",
  aiGroq: "ai_groq",
} as const;

export type IntegrationProvider =
  (typeof INTEGRATION_PROVIDERS)[keyof typeof INTEGRATION_PROVIDERS];

export type StoredCredentialsEnvelope = {
  v: 1;
  cipher: "aes-256-gcm";
  blob: string;
};

export function wrapEncryptedCredentials(
  plain: Record<string, unknown>,
): StoredCredentialsEnvelope {
  return {
    v: 1,
    cipher: "aes-256-gcm",
    blob: encryptCredentialsPayload(plain),
  };
}

export function unwrapEncryptedCredentials<T extends Record<string, unknown>>(
  row: StoredCredentialsEnvelope | null | undefined,
): T | null {
  if (!row?.blob || row.v !== 1 || row.cipher !== "aes-256-gcm") return null;
  try {
    return decryptCredentialsPayload<T>(row.blob);
  } catch {
    throw new IntegrationCredentialsError(
      "credentials_store",
      "Failed to decrypt integration credentials",
    );
  }
}

export async function getTenantCredentials<T extends Record<string, unknown>>(
  tenantId: string,
  provider: IntegrationProvider,
): Promise<T | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("api_integrations")
    .select("credentials_json")
    .eq("tenant_id", tenantId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    throw new IntegrationError("credentials_store", "provider_error", error.message, {
      detail: { code: error.code },
    });
  }
  const raw = data?.credentials_json as StoredCredentialsEnvelope | null | undefined;
  if (!raw) return null;
  return unwrapEncryptedCredentials<T>(raw);
}

export async function upsertTenantCredentials(
  tenantId: string,
  provider: IntegrationProvider,
  plain: Record<string, unknown>,
  settings?: Record<string, unknown>,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const credentials_json = wrapEncryptedCredentials(plain);
  const { error } = await supabase.from("api_integrations").upsert(
    {
      tenant_id: tenantId,
      provider,
      credentials_json: credentials_json as unknown as Record<string, unknown>,
      settings: settings ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,provider" },
  );

  if (error) {
    throw new IntegrationError("credentials_store", "provider_error", error.message, {
      detail: { code: error.code },
    });
  }
}
