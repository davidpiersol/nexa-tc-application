/**
 * Audit rows for integration calls — uses **service role** so webhooks and workers can log without a user session.
 */
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type IntegrationAuditParams = {
  tenantId: string;
  transactionId?: string | null;
  provider: string;
  /** Short verb, e.g. `mls.getListing`, `docusign.createEnvelope`. */
  operation: string;
  detail?: Record<string, unknown>;
  /** When invoked from an authenticated Route Handler, pass auth user id. */
  actorId?: string | null;
};

/**
 * Best-effort audit insert; failures are swallowed so integrations never fail only because audit insert failed.
 */
export async function auditIntegrationAction(params: IntegrationAuditParams): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("audit_log").insert({
      tenant_id: params.tenantId,
      transaction_id: params.transactionId ?? null,
      table_name: `integration:${params.provider}`,
      record_id: null,
      operation: "INSERT",
      old_data: null,
      new_data: {
        source: "integration_sdk",
        provider: params.provider,
        operation: params.operation,
        detail: params.detail ?? {},
      },
      actor_id: params.actorId ?? null,
    });
    if (error) {
      console.warn("[auditIntegrationAction]", error.message);
    }
  } catch (e) {
    console.warn("[auditIntegrationAction]", e);
  }
}
