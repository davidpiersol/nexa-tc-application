import {
  unwrapEncryptedCredentials,
  wrapEncryptedCredentials,
  type IntegrationProvider,
  type StoredCredentialsEnvelope,
} from "@/lib/integrations/credentials-store";
import { IntegrationError } from "@/lib/integrations/errors";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type GlobalCredentialStatus = {
  provider: IntegrationProvider;
  configured: boolean;
  settings: Record<string, unknown>;
  updatedAt: string | null;
};

type GlobalCredentialRow = {
  provider: IntegrationProvider;
  credentials_json: StoredCredentialsEnvelope | null;
  settings: Record<string, unknown> | null;
  updated_at: string | null;
};

export async function listGlobalCredentialStatuses(): Promise<GlobalCredentialStatus[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("global_provider_credentials")
    .select("provider, credentials_json, settings, updated_at")
    .order("provider", { ascending: true });

  if (error) {
    throw new IntegrationError("global_credentials_store", "provider_error", error.message, {
      detail: { code: error.code },
    });
  }

  return ((data ?? []) as GlobalCredentialRow[]).map((row) => ({
    provider: row.provider,
    configured: Boolean(row.credentials_json?.blob),
    settings: row.settings ?? {},
    updatedAt: row.updated_at,
  }));
}

export async function getGlobalCredentials<T extends Record<string, unknown>>(
  provider: IntegrationProvider,
): Promise<T | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("global_provider_credentials")
    .select("credentials_json")
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    throw new IntegrationError("global_credentials_store", "provider_error", error.message, {
      detail: { code: error.code },
    });
  }

  return unwrapEncryptedCredentials<T>(
    data?.credentials_json as StoredCredentialsEnvelope | null | undefined,
  );
}

export async function upsertGlobalCredentials(
  provider: IntegrationProvider,
  plain: Record<string, unknown>,
  actorUserId: string,
  settings?: Record<string, unknown>,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const credentialsJson = wrapEncryptedCredentials(plain);
  const { error } = await supabase.from("global_provider_credentials").upsert(
    {
      provider,
      credentials_json: credentialsJson as unknown as Record<string, unknown>,
      settings: settings ?? {},
      created_by: actorUserId,
      updated_by: actorUserId,
    },
    { onConflict: "provider" },
  );

  if (error) {
    throw new IntegrationError("global_credentials_store", "provider_error", error.message, {
      detail: { code: error.code },
    });
  }
}
