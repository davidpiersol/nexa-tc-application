import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isPrivilegedRole } from "@/lib/auth/roles";
import { normalizeMlsEntryJobInput } from "@/lib/mls/mls-entry-job";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  requesting_broker_name: z.string().max(240).optional().nullable(),
  listing_broker_name: z.string().max(240).optional().nullable(),
  listing_client_name: z.string().max(240).optional().nullable(),
  seller_names: z.string().max(500).optional().nullable(),
  property_address: z.string().max(500).optional().nullable(),
  property_legal_description: z.string().max(2000).optional().nullable(),
  property_type: z.string().max(120).optional().nullable(),
  parcel_number: z.string().max(120).optional().nullable(),
  acreage: z.string().max(80).optional().nullable(),
  list_price: z.union([z.string(), z.number()]).optional().nullable(),
  mls_number: z.string().max(120).optional().nullable(),
  general_notes: z.string().max(5000).optional().nullable(),
  status: z.string().max(80).optional().nullable(),
  billing_status: z.string().max(80).optional().nullable(),
});

export async function GET(request: NextRequest) {
  const actor = await loadActorContext();
  const limited = await enforceApiRateLimit(request, actor?.userId);
  if (limited) return limited;
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPrivilegedRole(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mls_entry_jobs")
    .select("*")
    .eq("tenant_id", actor.tenantId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const actor = await loadActorContext();
  const limited = await enforceApiRateLimit(request, actor?.userId);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPrivilegedRole(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const normalized = normalizeMlsEntryJobInput(parsed);
  if (!normalized.requesting_broker_name || !normalized.property_address) {
    return NextResponse.json(
      { error: "requesting_broker_and_property_required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mls_entry_jobs")
    .insert({
      ...normalized,
      tenant_id: actor.tenantId,
      requested_by: actor.userId,
      source_payload: {
        write_access: "not_configured",
        mls_submission: "manual_only_until_write_access_confirmed",
      },
    })
    .select("id, tenant_id, property_address, status, billing_status")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 500 });
  }

  await insertApiAudit(request, supabase, {
    tenantId: actor.tenantId,
    operation: "mls_entry_jobs.create",
    detail: {
      job_id: data.id,
      property_address: data.property_address,
      status: data.status,
      billing_status: data.billing_status,
    },
  });

  return NextResponse.json({ job: data });
}
