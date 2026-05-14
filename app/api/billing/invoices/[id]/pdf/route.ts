import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PDFDocument, type PDFFont, type PDFPage, type RGB, StandardFonts, rgb } from "pdf-lib";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isPrivilegedRole } from "@/lib/auth/roles";
import { formatCurrencyFromCents, formatPaymentTerms } from "@/lib/billing/invoices";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: { id: string } };

type InvoiceLineRow = {
  id: string;
  description: string | null;
  quantity: string | number | null;
  unit_amount_cents: number | null;
  line_total_cents: number | null;
};

type InvoicePdfRow = {
  id: string;
  invoice_number: string | null;
  broker_name: string | null;
  broker_contact_id: string | null;
  issue_date: string | null;
  due_date: string | null;
  subtotal_cents: number | null;
  tax_cents: number | null;
  tax_rate_percent: number | null;
  total_cents: number | null;
  balance_cents: number | null;
  payment_terms: string | null;
  notes: string | null;
  billing_invoice_line_items?: InvoiceLineRow[] | null;
};

const NAVY = rgb(0.09, 0.16, 0.29);
const TEXT = rgb(0.2, 0.2, 0.2);
const MUTED = rgb(0.45, 0.43, 0.4);
const RULE = rgb(0.78, 0.76, 0.72);

export async function GET(request: NextRequest, { params }: Ctx) {
  const actor = await loadActorContext();
  const limited = await enforceApiRateLimit(request, actor?.userId);
  if (limited) return limited;
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPrivilegedRole(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_invoices")
    .select("*, billing_invoice_line_items(*)")
    .eq("id", params.id)
    .eq("tenant_id", actor.tenantId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const invoice = data as InvoicePdfRow;
  const brokerEmail = await loadBrokerEmail(supabase, actor.tenantId, invoice.broker_contact_id);
  const pdfBytes = await renderInvoicePdf(invoice, {
    senderName: "Choral Point",
    senderLine1: "Transaction coordination services",
    senderLine2: "New Mexico",
    brokerEmail,
  });
  const filename = `invoice-${safeFilename(invoice.invoice_number ?? invoice.id)}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

async function loadBrokerEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  brokerContactId: string | null,
): Promise<string | null> {
  if (!brokerContactId) return null;
  const { data } = await supabase
    .from("contacts")
    .select("email")
    .eq("id", brokerContactId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return (data?.email as string | null) ?? null;
}

async function renderInvoicePdf(
  invoice: InvoicePdfRow,
  sender: {
    senderName: string;
    senderLine1: string;
    senderLine2: string;
    brokerEmail: string | null;
  },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const regular = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 54;
  const width = page.getWidth();
  let y = 730;

  page.drawText("Invoice", { x: margin, y, size: 30, font: bold, color: NAVY });
  drawRight(page, invoice.invoice_number ?? "Draft invoice", width - margin, y + 7, 13, sansBold, NAVY);
  y -= 24;
  drawRight(page, `Issue date: ${invoice.issue_date ?? "TBD"}`, width - margin, y, 10, sans, MUTED);
  y -= 16;
  drawRight(page, `Due date: ${invoice.due_date ?? invoice.issue_date ?? "TBD"}`, width - margin, y, 10, sans, MUTED);

  y -= 42;
  drawBlockTitle(page, "Bill To", margin, y, sansBold);
  drawWrapped(page, invoice.broker_name ?? "Client TBD", margin, y - 18, 210, 11, regular, TEXT);
  if (sender.brokerEmail) drawWrapped(page, sender.brokerEmail, margin, y - 34, 210, 10, regular, MUTED);

  drawBlockTitle(page, "From", 346, y, sansBold);
  drawWrapped(page, sender.senderName, 346, y - 18, 210, 11, regular, TEXT);
  drawWrapped(page, sender.senderLine1, 346, y - 34, 210, 10, regular, MUTED);
  drawWrapped(page, sender.senderLine2, 346, y - 49, 210, 10, regular, MUTED);

  y -= 92;
  drawLine(page, margin, y, width - margin);
  y -= 28;
  page.drawText("Description", { x: margin, y, size: 9, font: sansBold, color: MUTED });
  page.drawText("Qty", { x: 340, y, size: 9, font: sansBold, color: MUTED });
  page.drawText("Unit", { x: 398, y, size: 9, font: sansBold, color: MUTED });
  page.drawText("Line Total", { x: 485, y, size: 9, font: sansBold, color: MUTED });
  y -= 12;
  drawLine(page, margin, y, width - margin);
  y -= 22;

  const lines = Array.isArray(invoice.billing_invoice_line_items)
    ? invoice.billing_invoice_line_items
    : [];
  for (const line of lines.length ? lines : [fallbackLine(invoice)]) {
    drawWrapped(page, line.description ?? "Choral Point service", margin, y, 250, 11, regular, NAVY);
    page.drawText(String(line.quantity ?? "1"), { x: 340, y, size: 10, font: regular, color: TEXT });
    page.drawText(formatCurrencyFromCents(Number(line.unit_amount_cents ?? 0)), {
      x: 398,
      y,
      size: 10,
      font: regular,
      color: TEXT,
    });
    page.drawText(formatCurrencyFromCents(Number(line.line_total_cents ?? 0)), {
      x: 485,
      y,
      size: 10,
      font: regular,
      color: TEXT,
    });
    y -= 26;
  }

  y -= 6;
  drawLine(page, margin, y, width - margin);
  y -= 34;
  drawSummary(page, "Subtotal", invoice.subtotal_cents, y, sans, regular);
  y -= 20;
  drawSummary(
    page,
    `Tax (${Number(invoice.tax_rate_percent ?? 0)}%)`,
    invoice.tax_cents,
    y,
    sans,
    regular,
  );
  y -= 20;
  drawSummary(page, "Total", invoice.total_cents, y, sansBold, bold);
  y -= 20;
  drawSummary(page, "Balance due", invoice.balance_cents, y, sansBold, bold);

  y -= 46;
  drawBlockTitle(page, "Payment Terms", margin, y, sansBold);
  drawWrapped(page, formatPaymentTerms(invoice.payment_terms), margin, y - 18, 250, 10, regular, TEXT);
  if (invoice.notes) {
    drawBlockTitle(page, "Notes", margin, y - 54, sansBold);
    drawWrapped(page, invoice.notes, margin, y - 72, 500, 10, regular, TEXT);
  }

  page.drawText("Thank you for your business.", {
    x: margin,
    y: 54,
    size: 11,
    font: regular,
    color: NAVY,
  });

  return doc.save();
}

function fallbackLine(invoice: InvoicePdfRow): InvoiceLineRow {
  return {
    id: "fallback",
    description: "Choral Point service",
    quantity: 1,
    unit_amount_cents: invoice.subtotal_cents ?? 0,
    line_total_cents: invoice.subtotal_cents ?? 0,
  };
}

function drawBlockTitle(
  page: PDFPage,
  label: string,
  x: number,
  y: number,
  font: PDFFont,
) {
  page.drawText(label.toUpperCase(), { x, y, size: 9, font, color: MUTED });
}

function drawSummary(
  page: PDFPage,
  label: string,
  valueCents: number | null,
  y: number,
  labelFont: PDFFont,
  valueFont: PDFFont,
) {
  page.drawText(label, { x: 365, y, size: 11, font: labelFont, color: TEXT });
  drawRight(page, formatCurrencyFromCents(Number(valueCents ?? 0)), 558, y, 11, valueFont, NAVY);
}

function drawLine(
  page: PDFPage,
  x1: number,
  y: number,
  x2: number,
) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 1, color: RULE });
}

function drawRight(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB,
) {
  page.drawText(text, {
    x: rightX - font.widthOfTextAtSize(text, size),
    y,
    size,
    font,
    color,
  });
}

function drawWrapped(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  font: PDFFont,
  color: RGB,
) {
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size, font, color });
      cursorY -= size + 4;
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) page.drawText(line, { x, y: cursorY, size, font, color });
}

function safeFilename(value: string): string {
  const safe = value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "");
  return safe || "invoice";
}
