import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    ""
  );
}

/**
 * Authenticated API audit row — **RLS insert** with `actor_id = auth.uid()`.
 * Stores **IP** + **User-Agent** inside `new_data.detail` for compliance review.
 */
export async function insertApiAudit(
  request: NextRequest,
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    transactionId?: string | null;
    operation: string;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("audit_log").insert({
      tenant_id: params.tenantId,
      transaction_id: params.transactionId ?? null,
      table_name: "api_route",
      record_id: null,
      operation: "INSERT",
      old_data: null,
      new_data: {
        source: "api",
        operation: params.operation,
        detail: {
          ...(params.detail ?? {}),
          ip: clientIp(request),
          user_agent: request.headers.get("user-agent") ?? "",
        },
      },
      actor_id: user.id,
    });
  } catch (e) {
    console.warn("[insertApiAudit]", e);
  }
}
