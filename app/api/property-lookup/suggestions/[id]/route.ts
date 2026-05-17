import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isPrivilegedRole } from "@/lib/auth/roles";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ accept: z.boolean() });

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const actor = await loadActorContext();
  const limited = await enforceApiRateLimit(request, actor?.userId);
  if (limited) return limited;
  if (!(await validateCsrf(request))) return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPrivilegedRole(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let parsed: z.infer<typeof bodySchema>;
  try { parsed = bodySchema.parse(await request.json()); } catch { return NextResponse.json({ error: "invalid_body" }, { status: 400 }); }
  const supabase = await createClient();
  const { data: suggestion } = await supabase.from("property_lookup_suggestions").select("id, transaction_id, field_key, suggested_value").eq("tenant_id", actor.tenantId).eq("id", params.id).maybeSingle();
  if (!suggestion) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const now = new Date().toISOString();
  await supabase.from("property_lookup_suggestions").update(parsed.accept ? { accepted_at: now, accepted_by: actor.userId } : { rejected_at: now, rejected_by: actor.userId }).eq("id", suggestion.id).eq("tenant_id", actor.tenantId);
  if (parsed.accept && suggestion.transaction_id) {
    const { data: tx } = await supabase.from("transactions").select("intake_data, property_data").eq("tenant_id", actor.tenantId).eq("id", suggestion.transaction_id).maybeSingle();
    if (tx) {
      const intake = { ...((tx.intake_data ?? {}) as Record<string, unknown>) };
      const propertyData = { ...((tx.property_data ?? {}) as Record<string, unknown>) };
      if (suggestion.field_key === "property_address") {
        await supabase.from("transactions").update({ property_address: suggestion.suggested_value, property_data: { ...propertyData, sources: { ...(propertyData.sources as object ?? {}), property_address: "manual_text" } } }).eq("id", suggestion.transaction_id).eq("tenant_id", actor.tenantId);
      } else {
        intake[suggestion.field_key] = suggestion.suggested_value;
        await supabase.from("transactions").update({ intake_data: intake, property_data: { ...propertyData, sources: { ...(propertyData.sources as object ?? {}), [suggestion.field_key]: "manual_text" } } }).eq("id", suggestion.transaction_id).eq("tenant_id", actor.tenantId);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
