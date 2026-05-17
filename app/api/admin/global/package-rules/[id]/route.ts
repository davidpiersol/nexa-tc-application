import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

type Ctx = { params: { id: string } };

const ruleItemSchema = z.discriminatedUnion("itemType", [
  z.object({
    itemType: z.literal("global_template"),
    sortOrder: z.number().int(),
    templateId: z.string().uuid(),
  }),
  z.object({
    itemType: z.literal("broker_upload"),
    sortOrder: z.number().int(),
    placeholderLabel: z.string().trim().min(1).max(240),
  }),
  z.object({
    itemType: z.literal("title_upload"),
    sortOrder: z.number().int(),
    placeholderLabel: z.string().trim().min(1).max(240),
  }),
]);

const patchSchema = z.object({
  name: z.string().trim().min(2).max(180).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  items: z.array(ruleItemSchema).optional(),
});

const RULE_SELECT =
  "id, tenant_id, package_kind, name, slug, description, is_active, metadata, created_at, updated_at";

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const { actor, error } = await requireGlobalAdmin();
  if (error) return error;
  const current = actor!;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: existing, error: loadErr } = await admin
    .from("document_package_rules")
    .select("id")
    .eq("id", ctx.params.id)
    .maybeSingle();
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_by: current.userId };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;

  if (Object.keys(updates).length > 1) {
    const { error: upErr } = await admin
      .from("document_package_rules")
      .update(updates)
      .eq("id", ctx.params.id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  if (parsed.data.items) {
    const { error: delErr } = await admin
      .from("document_package_rule_items")
      .delete()
      .eq("rule_id", ctx.params.id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });

    const rows = parsed.data.items.map((item) => {
      if (item.itemType === "global_template") {
        return {
          rule_id: ctx.params.id,
          sort_order: item.sortOrder,
          item_type: "global_template",
          global_document_template_id: item.templateId,
          placeholder_label: null,
          metadata: {},
        };
      }
      return {
        rule_id: ctx.params.id,
        sort_order: item.sortOrder,
        item_type: item.itemType,
        global_document_template_id: null,
        placeholder_label: item.placeholderLabel,
        metadata: {},
      };
    });

    if (rows.length) {
      const { error: insErr } = await admin.from("document_package_rule_items").insert(rows);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
    }
  }

  const { data: full, error: fullErr } = await admin
    .from("document_package_rules")
    .select(
      `${RULE_SELECT}, document_package_rule_items(id, rule_id, sort_order, item_type, global_document_template_id, placeholder_label, metadata)`,
    )
    .eq("id", ctx.params.id)
    .maybeSingle();

  if (fullErr) return NextResponse.json({ error: fullErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, rule: full });
}
