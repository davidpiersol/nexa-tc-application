"use server";

import type { PipelineColumnId } from "@/components/dashboard/tc-pipeline-kanban";
import { columnToTransactionStatus } from "@/lib/data/pipeline-map";
import { createClient } from "@/lib/supabase/server";

export async function updateTransactionPipelineStage(
  transactionId: string,
  targetColumn: PipelineColumnId,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const status = columnToTransactionStatus(targetColumn);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: tenantRow, error: userErr } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (userErr || !tenantRow?.tenant_id) {
    return { ok: false, error: "unauthorized" };
  }

  const { error } = await supabase
    .from("transactions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", transactionId)
    .eq("tenant_id", tenantRow.tenant_id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
