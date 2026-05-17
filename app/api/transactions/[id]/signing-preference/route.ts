import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isPrivilegedRole } from "@/lib/auth/roles";
import { resolveSigningPreferenceForTransaction } from "@/lib/signing/broker-signing-preference";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type Ctx = { params: { id: string } };

export async function GET(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPrivilegedRole(actor.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createServiceRoleClient();
  const { data: tx, error: txErr } = await admin
    .from("transactions")
    .select("id, tenant_id")
    .eq("id", ctx.params.id)
    .eq("tenant_id", actor.tenantId)
    .maybeSingle();

  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
  if (!tx) return NextResponse.json({ error: "transaction_not_found" }, { status: 404 });

  const { workflow, broker } = await resolveSigningPreferenceForTransaction({
    admin,
    tenantId: actor.tenantId,
    transactionId: ctx.params.id,
  });

  return NextResponse.json({
    default_provider_slug: workflow.slug,
    default_provider_label: workflow.label,
    broker_signing_platform: broker.signingPlatformRaw,
    broker_profile_id: broker.brokerProfileId,
  });
}
