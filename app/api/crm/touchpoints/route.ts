import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { contactBelongsToTenant, requireCrmApiActor } from "@/lib/crm/api";
import {
  crmTouchpointSchema,
  nullableDateTime,
  nullableText,
  nullableUuid,
} from "@/lib/crm/validation";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const guard = await requireCrmApiActor(request);
  if (guard.response) return guard.response;

  const parsed = crmTouchpointSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });
  const body = parsed.data;
  if (!(await contactBelongsToTenant(guard.actor.tenantId, body.contactId))) {
    return NextResponse.json({ error: "contact_not_found" }, { status: 404 });
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("crm_touchpoints")
    .insert({
      tenant_id: guard.actor.tenantId,
      owner_user_id: guard.actor.userId,
      contact_id: body.contactId,
      transaction_id: nullableUuid(body.transactionId),
      touch_type: body.touchType,
      direction: body.direction,
      body: nullableText(body.body),
      outcome: nullableText(body.outcome),
      next_action: nullableText(body.nextAction),
      occurred_at: nullableDateTime(body.occurredAt) ?? new Date().toISOString(),
      created_by: guard.actor.userId,
      updated_by: guard.actor.userId,
    })
    .select("id")
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 500 });
  return NextResponse.json({ touchpoint: data });
}
