"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateFirstPassStatus(params: {
  transactionId: string;
  firstPassStatus: "pending" | "in_review" | "approved" | "rejected";
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: tenantRow } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!tenantRow?.tenant_id) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("transactions")
    .update({
      first_pass_status: params.firstPassStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.transactionId)
    .eq("tenant_id", tenantRow.tenant_id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
