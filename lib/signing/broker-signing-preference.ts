import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveSigningWorkflowSlug } from "@/lib/signing/signing-workflow";

export type BrokerSigningPreference = {
  signingPlatformRaw: string | null;
  contactId: string | null;
  brokerProfileId: string | null;
};

/**
 * First broker assignment on the transaction wins (deterministic by `created_at`).
 */
export async function loadBrokerSigningPreferenceForTransaction(params: {
  admin: SupabaseClient;
  tenantId: string;
  transactionId: string;
}): Promise<BrokerSigningPreference> {
  const { data: rows, error } = await params.admin
    .from("transaction_contact_assignments")
    .select("contact_id, created_at")
    .eq("tenant_id", params.tenantId)
    .eq("transaction_id", params.transactionId)
    .eq("assignment_role", "broker")
    .order("created_at", { ascending: true });

  if (error || !rows?.length) {
    return {
      signingPlatformRaw: null,
      contactId: null,
      brokerProfileId: null,
    };
  }

  for (const row of rows) {
    const cid = row.contact_id as string;
    const { data: profile } = await params.admin
      .from("broker_profiles")
      .select("id, signing_platform")
      .eq("tenant_id", params.tenantId)
      .eq("contact_id", cid)
      .maybeSingle();
    if (profile) {
      return {
        signingPlatformRaw:
          typeof profile.signing_platform === "string"
            ? profile.signing_platform.trim() || null
            : null,
        contactId: cid,
        brokerProfileId: profile.id as string,
      };
    }
  }

  return {
    signingPlatformRaw: null,
    contactId: (rows[0]!.contact_id as string) ?? null,
    brokerProfileId: null,
  };
}

export async function resolveSigningPreferenceForTransaction(params: {
  admin: SupabaseClient;
  tenantId: string;
  transactionId: string;
}): Promise<{
  workflow: ReturnType<typeof resolveSigningWorkflowSlug>;
  broker: BrokerSigningPreference;
}> {
  const broker = await loadBrokerSigningPreferenceForTransaction(params);
  return {
    broker,
    workflow: resolveSigningWorkflowSlug(broker.signingPlatformRaw),
  };
}
