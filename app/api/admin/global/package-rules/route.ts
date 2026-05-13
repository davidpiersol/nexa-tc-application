import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const packageKindSchema = z.enum(["seller", "buyer", "title"]);

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

const createSchema = z.object({
  packageKind: packageKindSchema,
  name: z.string().trim().min(2).max(180),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug_format"),
  description: z.string().trim().max(2000).optional(),
  isActive: z.boolean().optional().default(true),
  tenantId: z.string().uuid().nullable().optional(),
  items: z.array(ruleItemSchema).optional().default([]),
});

const RULE_SELECT =
  "id, tenant_id, package_kind, name, slug, description, is_active, metadata, created_at, updated_at";

export async function GET(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  const { error } = await requireGlobalAdmin();
  if (error) return error;

  const admin = createServiceRoleClient();
  const { data, error: qErr } = await admin
    .from("document_package_rules")
    .select(
      `${RULE_SELECT}, document_package_rule_items(id, rule_id, sort_order, item_type, global_document_template_id, placeholder_label, metadata)`,
    )
    .order("updated_at", { ascending: false });
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  return NextResponse.json({ rules: data ?? [] });
}

export async function POST(request: NextRequest) {
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
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const tenantId = parsed.data.tenantId ?? null;
  const admin = createServiceRoleClient();

  const { data: rule, error: insertErr } = await admin
    .from("document_package_rules")
    .insert({
      tenant_id: tenantId,
      package_kind: parsed.data.packageKind,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      is_active: parsed.data.isActive,
      metadata: {},
      created_by: current.userId,
      updated_by: current.userId,
    })
    .select(RULE_SELECT)
    .single();

  if (insertErr) {
    const msg = insertErr.message.includes("duplicate") ? "slug_conflict" : insertErr.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const ruleId = rule!.id as string;
  const items = parsed.data.items ?? [];

  if (items.length) {
    const rows = items.map((item) => {
      if (item.itemType === "global_template") {
        return {
          rule_id: ruleId,
          sort_order: item.sortOrder,
          item_type: "global_template",
          global_document_template_id: item.templateId,
          placeholder_label: null,
          metadata: {},
        };
      }
      return {
        rule_id: ruleId,
        sort_order: item.sortOrder,
        item_type: item.itemType,
        global_document_template_id: null,
        placeholder_label: item.placeholderLabel,
        metadata: {},
      };
    });

    const { error: itemsErr } = await admin.from("document_package_rule_items").insert(rows);
    if (itemsErr) {
      await admin.from("document_package_rules").delete().eq("id", ruleId);
      return NextResponse.json({ error: itemsErr.message }, { status: 400 });
    }
  }

  const { data: full, error: loadErr } = await admin
    .from("document_package_rules")
    .select(
      `${RULE_SELECT}, document_package_rule_items(id, rule_id, sort_order, item_type, global_document_template_id, placeholder_label, metadata)`,
    )
    .eq("id", ruleId)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, rule: full });
}
