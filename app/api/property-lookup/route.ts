import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isPrivilegedRole } from "@/lib/auth/roles";
import { getPropertyByAddress } from "@/lib/clerk/client";
import { parseUsAddress } from "@/lib/inngest/first-pass/parse-address";
import { normalizeAttomSuggestions } from "@/lib/property-lookup/attom-normalize";
import { extractManualPropertySuggestions } from "@/lib/property-lookup/manual-extract";
import { missingPropertyFields } from "@/lib/property-lookup/registry";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  transactionId: z.string().uuid().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  county: z.string().max(120).optional().nullable(),
  manualText: z.string().max(12000).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const actor = await loadActorContext();
  const limited = await enforceApiRateLimit(request, actor?.userId);
  if (limited) return limited;
  if (!(await validateCsrf(request))) return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPrivilegedRole(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let parsed: z.infer<typeof bodySchema>;
  try { parsed = bodySchema.parse(await request.json()); }
  catch { return NextResponse.json({ error: "invalid_body" }, { status: 400 }); }

  const supabase = await createClient();
  const normalizedQuery = (parsed.address ?? parsed.county ?? "manual-entry").trim() || "manual-entry";
  const manualSuggestions = parsed.manualText?.trim() ? extractManualPropertySuggestions(parsed.manualText) : [];
  let providerSuggestions = [] as ReturnType<typeof normalizeAttomSuggestions>;
  let rawSnapshot: unknown = null;
  const parsedAddress = parseUsAddress(parsed.address);
  if (parsedAddress) {
    try {
      rawSnapshot = await getPropertyByAddress({ tenantId: actor.tenantId, actorId: actor.userId, ...parsedAddress });
      providerSuggestions = normalizeAttomSuggestions(rawSnapshot);
    } catch {
      providerSuggestions = [];
    }
  }
  const suggestions = providerSuggestions.length ? providerSuggestions : manualSuggestions;
  const { data: countySource } = parsed.county
    ? await supabase.from("property_data_county_sources").select("id, county_name, portal_type, search_url").eq("state", "NM").ilike("county_name", parsed.county).maybeSingle()
    : { data: null };
  const retrievedFields = Object.fromEntries(suggestions.map((item) => [item.fieldKey, item.value]));
  const status = suggestions.length ? "success" : "manual_required";
  const { data: run, error: runError } = await supabase.from("property_lookup_runs").insert({ tenant_id: actor.tenantId, transaction_id: parsed.transactionId ?? null, requested_by: actor.userId, source_kind: providerSuggestions.length ? "attom" : manualSuggestions.length ? "manual_text" : "county_registry", source_label: providerSuggestions.length ? "ATTOM" : countySource?.county_name ?? "manual fallback", county_source_id: countySource?.id ?? null, query_type: parsed.address ? "address" : "manual", normalized_query: normalizedQuery, status, retrieved_fields: retrievedFields, missing_fields: missingPropertyFields(retrievedFields), raw_snapshot: rawSnapshot, source_notes: providerSuggestions.length ? "Configured statewide provider response normalized; human confirmation required." : manualSuggestions.length ? "Manual text extraction only; human confirmation required." : "No configured structured provider; use manual entry or reviewed county source." }).select("id, status, missing_fields").single();
  if (runError || !run) return NextResponse.json({ error: runError?.message ?? "lookup_run_failed" }, { status: 500 });
  if (suggestions.length) {
    await supabase.from("property_lookup_suggestions").insert(suggestions.map((item) => ({ tenant_id: actor.tenantId, transaction_id: parsed.transactionId ?? null, lookup_run_id: run.id, field_key: item.fieldKey, suggested_value: item.value, source_kind: item.sourceKind, confidence: item.confidence, source_notes: item.sourceNotes })));
  }
  return NextResponse.json({ run, suggestions, countySource });
}
