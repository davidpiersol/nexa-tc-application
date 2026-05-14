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

type Ctx = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Ctx) {
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
    .update({
      contact_id: body.contactId,
      transaction_id: nullableUuid(body.transactionId),
      touch_type: body.touchType,
      direction: body.direction,
      body: nullableText(body.body),
      outcome: nullableText(body.outcome),
      next_action: nullableText(body.nextAction),
      occurred_at: nullableDateTime(body.occurredAt) ?? new Date().toISOString(),
      updated_by: guard.actor.userId,
    })
    .eq("id", params.id)
    .eq("tenant_id", guard.actor.tenantId)
    .eq("owner_user_id", guard.actor.userId)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ touchpoint: data });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const guard = await requireCrmApiActor(request);
  if (guard.response) return guard.response;

  const admin = createServiceRoleClient();
  const { error, count } = await admin
    .from("crm_touchpoints")
    .delete({ count: "exact" })
    .eq("id", params.id)
    .eq("tenant_id", guard.actor.tenantId)
    .eq("owner_user_id", guard.actor.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
