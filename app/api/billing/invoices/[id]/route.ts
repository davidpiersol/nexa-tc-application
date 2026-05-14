import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { insertApiAudit } from "@/lib/audit/route-audit";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isPrivilegedRole } from "@/lib/auth/roles";
import {
  calculateInvoiceTotals,
  calculateLineTotalCents,
  centsFromCurrencyInput,
  DEFAULT_INVOICE_REMINDER_DAYS,
  deriveReceivableStatus,
  normalizeBillingServiceCode,
  normalizeInvoiceStatus,
  normalizeReceivableStatus,
  normalizeTaxRatePercent,
} from "@/lib/billing/invoices";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: { id: string } };

const bodySchema = z.object({
  broker_name: z.string().trim().max(240).optional().nullable(),
  broker_contact_id: z.string().uuid().optional().nullable(),
  service_code: z.string().trim().max(80).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  quantity: z.union([z.string(), z.number()]).optional().nullable(),
  unit_amount: z.union([z.string(), z.number()]).optional().nullable(),
  tax_amount: z.union([z.string(), z.number()]).optional().nullable(),
  tax_rate_percent: z.union([z.string(), z.number()]).optional().nullable(),
  status: z.string().trim().max(80).optional().nullable(),
  receivable_status: z.string().trim().max(80).optional().nullable(),
  issue_date: z.string().trim().max(20).optional().nullable(),
  due_date: z.string().trim().max(20).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function quantityFromInput(value: string | number | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function isoDateOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : trimmed;
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
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

  const serviceCode = normalizeBillingServiceCode(parsed.service_code);
  const status = normalizeInvoiceStatus(parsed.status);
  const explicitReceivableStatus = normalizeReceivableStatus(parsed.receivable_status);
  const quantity = quantityFromInput(parsed.quantity);
  const unitAmountCents = centsFromCurrencyInput(parsed.unit_amount);
  const taxCents = centsFromCurrencyInput(parsed.tax_amount);
  const taxRatePercent = normalizeTaxRatePercent(parsed.tax_rate_percent);
  const lineTotalCents = calculateLineTotalCents(quantity, unitAmountCents);
  const calculatedTotals = calculateInvoiceTotals([{ quantity, unitAmountCents }], taxCents);
  const totals = status === "paid" ? { ...calculatedTotals, balanceCents: 0 } : calculatedTotals;
  const issueDate = isoDateOrNull(parsed.issue_date) ?? new Date().toISOString().slice(0, 10);
  const dueDate = isoDateOrNull(parsed.due_date) ?? issueDate;
  const receivableStatus = deriveReceivableStatus({
    invoiceStatus: status,
    currentReceivableStatus: explicitReceivableStatus,
    balanceCents: totals.balanceCents,
    dueDate,
  });

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("billing_invoices")
    .select("id")
    .eq("id", params.id)
    .eq("tenant_id", actor.tenantId)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: invoice, error: invoiceError } = await supabase
    .from("billing_invoices")
    .update({
      status,
      receivable_status: receivableStatus,
      broker_contact_id: parsed.broker_contact_id ?? null,
      broker_name: text(parsed.broker_name),
      issue_date: issueDate,
      due_date: dueDate,
      paid_at: status === "paid" ? new Date().toISOString() : null,
      subtotal_cents: totals.subtotalCents,
      tax_cents: totals.taxCents,
      tax_rate_percent: taxRatePercent,
      total_cents: totals.totalCents,
      balance_cents: totals.balanceCents,
      reminder_schedule: DEFAULT_INVOICE_REMINDER_DAYS,
      next_reminder_due_at: totals.balanceCents > 0 ? dueDate : null,
      notes: text(parsed.notes),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("tenant_id", actor.tenantId)
    .select("id, invoice_number, total_cents, balance_cents")
    .maybeSingle();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: invoiceError?.message ?? "invoice_update_failed" }, { status: 500 });
  }

  const { data: serviceType } = await supabase
    .from("billing_service_types")
    .select("id")
    .eq("tenant_id", actor.tenantId)
    .eq("code", serviceCode)
    .maybeSingle();

  await supabase
    .from("billing_invoice_line_items")
    .delete()
    .eq("invoice_id", params.id)
    .eq("tenant_id", actor.tenantId);

  const { error: lineError } = await supabase.from("billing_invoice_line_items").insert({
    tenant_id: actor.tenantId,
    invoice_id: params.id,
    service_type_id: serviceType?.id ?? null,
    service_code: serviceCode,
    description: text(parsed.description) ?? "Choral Point service",
    quantity,
    unit_amount_cents: unitAmountCents,
    line_total_cents: lineTotalCents,
  });

  if (lineError) return NextResponse.json({ error: lineError.message }, { status: 500 });

  await insertApiAudit(request, supabase, {
    tenantId: actor.tenantId,
    operation: "billing_invoices.update",
    detail: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      total_cents: invoice.total_cents,
      balance_cents: invoice.balance_cents,
    },
  });

  return NextResponse.json({ invoice });
}
