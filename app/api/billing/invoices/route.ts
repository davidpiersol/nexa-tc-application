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
  deriveReceivableStatus,
  normalizeBillingServiceCode,
  normalizeInvoiceStatus,
  normalizeReceivableStatus,
} from "@/lib/billing/invoices";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  broker_name: z.string().trim().max(240).optional().nullable(),
  service_code: z.string().trim().max(80).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  quantity: z.union([z.string(), z.number()]).optional().nullable(),
  unit_amount: z.union([z.string(), z.number()]).optional().nullable(),
  tax_amount: z.union([z.string(), z.number()]).optional().nullable(),
  status: z.string().trim().max(80).optional().nullable(),
  receivable_status: z.string().trim().max(80).optional().nullable(),
  issue_date: z.string().trim().max(20).optional().nullable(),
  due_date: z.string().trim().max(20).optional().nullable(),
  source_transaction_id: z.string().uuid().optional().nullable(),
  source_mls_entry_job_id: z.string().uuid().optional().nullable(),
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

function invoiceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CP-${date}-${suffix}`;
}

export async function GET(request: NextRequest) {
  const actor = await loadActorContext();
  const limited = await enforceApiRateLimit(request, actor?.userId);
  if (limited) return limited;
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPrivilegedRole(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_invoices")
    .select("*, billing_invoice_line_items(*)")
    .eq("tenant_id", actor.tenantId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices: data ?? [] });
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

  if (parsed.source_transaction_id && parsed.source_mls_entry_job_id) {
    return NextResponse.json({ error: "choose_one_source" }, { status: 400 });
  }

  const serviceCode = normalizeBillingServiceCode(parsed.service_code);
  const status = normalizeInvoiceStatus(parsed.status);
  const explicitReceivableStatus = normalizeReceivableStatus(parsed.receivable_status);
  const quantity = quantityFromInput(parsed.quantity);
  const unitAmountCents = centsFromCurrencyInput(parsed.unit_amount);
  const taxCents = centsFromCurrencyInput(parsed.tax_amount);
  const lineTotalCents = calculateLineTotalCents(quantity, unitAmountCents);
  const calculatedTotals = calculateInvoiceTotals([{ quantity, unitAmountCents }], taxCents);
  const totals =
    status === "paid"
      ? { ...calculatedTotals, balanceCents: 0 }
      : calculatedTotals;
  const issueDate = isoDateOrNull(parsed.issue_date) ?? new Date().toISOString().slice(0, 10);
  const dueDate = isoDateOrNull(parsed.due_date);
  const receivableStatus = deriveReceivableStatus({
    invoiceStatus: status,
    currentReceivableStatus: explicitReceivableStatus,
    balanceCents: totals.balanceCents,
    dueDate,
  });
  const description = text(parsed.description) ?? "Choral Point service";

  const supabase = await createClient();
  const { data: serviceType } = await supabase
    .from("billing_service_types")
    .select("id")
    .eq("tenant_id", actor.tenantId)
    .eq("code", serviceCode)
    .maybeSingle();

  const { data: invoice, error: invoiceError } = await supabase
    .from("billing_invoices")
    .insert({
      tenant_id: actor.tenantId,
      invoice_number: invoiceNumber(),
      status,
      receivable_status: receivableStatus,
      broker_name: text(parsed.broker_name),
      source_transaction_id: parsed.source_transaction_id ?? null,
      source_mls_entry_job_id: parsed.source_mls_entry_job_id ?? null,
      issue_date: issueDate,
      due_date: dueDate,
      paid_at: status === "paid" ? new Date().toISOString() : null,
      subtotal_cents: totals.subtotalCents,
      tax_cents: totals.taxCents,
      total_cents: totals.totalCents,
      balance_cents: totals.balanceCents,
      accounting_sync_status: "not_configured",
      notes: text(parsed.notes),
      created_by: actor.userId,
    })
    .select("id, invoice_number, tenant_id, total_cents, balance_cents")
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: invoiceError?.message ?? "invoice_insert_failed" }, { status: 500 });
  }

  const { error: lineError } = await supabase.from("billing_invoice_line_items").insert({
    tenant_id: actor.tenantId,
    invoice_id: invoice.id,
    service_type_id: serviceType?.id ?? null,
    service_code: serviceCode,
    description,
    quantity,
    unit_amount_cents: unitAmountCents,
    line_total_cents: lineTotalCents,
  });

  if (lineError) {
    await supabase.from("billing_invoices").delete().eq("id", invoice.id).eq("tenant_id", actor.tenantId);
    return NextResponse.json({ error: lineError.message }, { status: 500 });
  }

  await insertApiAudit(request, supabase, {
    tenantId: actor.tenantId,
    operation: "billing_invoices.create",
    detail: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      service_code: serviceCode,
      total_cents: invoice.total_cents,
      balance_cents: invoice.balance_cents,
      accounting_sync_status: "not_configured",
    },
  });

  return NextResponse.json({ invoice });
}
