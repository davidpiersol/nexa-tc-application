import { createClient as createServerClient } from "@/lib/supabase/server";

export type AuditPayload = {
  tenantId: string;
  transactionId?: string | null;
  tableName: string;
  recordId?: string | null;
  operation: "INSERT" | "UPDATE" | "DELETE";
  /** Optional JSON snapshot — prefer triggers for DB rows; use for app-level events */
  detail?: Record<string, unknown>;
};

/**
 * Application-level audit row (RLS allows authenticated INSERT with matching actor).
 * IP / user-agent should be captured at the API route and stored in detail if needed.
 */
export async function auditAppAction(
  payload: AuditPayload,
  meta?: { ip?: string | null; userAgent?: string | null },
): Promise<void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_log").insert({
    tenant_id: payload.tenantId,
    transaction_id: payload.transactionId ?? null,
    table_name: payload.tableName,
    record_id: payload.recordId ?? null,
    operation: payload.operation,
    old_data: null,
    new_data: {
      source: "app",
      detail: payload.detail ?? {},
      ...(meta?.ip ? { ip: meta.ip } : {}),
      ...(meta?.userAgent ? { user_agent: meta.userAgent } : {}),
    },
    actor_id: user.id,
  });
}
