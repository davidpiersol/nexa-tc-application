import { describe, expect, it } from "vitest";
import {
  calculateInvoiceTotals,
  calculateLineTotalCents,
  centsFromCurrencyInput,
  deriveReceivableStatus,
  formatCurrencyFromCents,
  invoicePeriodKey,
  nextInvoiceReminder,
  normalizeTaxRatePercent,
  taxCentsFromRate,
} from "@/lib/billing/invoices";

describe("billing invoice helpers", () => {
  it("parses currency input and calculates line totals", () => {
    expect(centsFromCurrencyInput("$1,250.50")).toBe(125050);
    expect(centsFromCurrencyInput("bad")).toBe(0);
    expect(calculateLineTotalCents(2.5, 10000)).toBe(25000);
  });

  it("calculates subtotal, tax, total, and balance", () => {
    expect(
      calculateInvoiceTotals(
        [
          { quantity: 1, unitAmountCents: 50000 },
          { quantity: 2, unitAmountCents: 7500 },
        ],
        2500,
        10000,
      ),
    ).toEqual({
      subtotalCents: 65000,
      taxCents: 2500,
      totalCents: 67500,
      balanceCents: 57500,
    });
  });

  it("derives receivable status from invoice status and due date", () => {
    expect(
      deriveReceivableStatus({
        invoiceStatus: "draft",
        balanceCents: 10000,
        now: new Date("2026-05-13T12:00:00"),
      }),
    ).toBe("not_sent");
    expect(
      deriveReceivableStatus({
        invoiceStatus: "sent",
        balanceCents: 10000,
        dueDate: "2026-05-01",
        now: new Date("2026-05-13T12:00:00"),
      }),
    ).toBe("overdue");
    expect(
      deriveReceivableStatus({
        invoiceStatus: "paid",
        balanceCents: 0,
      }),
    ).toBe("paid");
  });

  it("formats money and summary period keys", () => {
    expect(formatCurrencyFromCents(123456)).toBe("$1,234.56");
    expect(invoicePeriodKey("2026-05-13", "month")).toBe("2026-05");
    expect(invoicePeriodKey("2026-05-13", "quarter")).toBe("2026-Q2");
    expect(invoicePeriodKey("2026-05-13", "year")).toBe("2026");
  });

  it("calculates and normalizes invoice tax rates", () => {
    expect(taxCentsFromRate(10000, 4.875)).toBe(488);
    expect(normalizeTaxRatePercent("7.625")).toBe(7.625);
    expect(normalizeTaxRatePercent("bad")).toBe(4.875);
  });

  it("summarizes payable-upon-receipt invoice reminders", () => {
    expect(
      nextInvoiceReminder({
        issueDate: "2026-05-13",
        dueDate: "2026-05-13",
        balanceCents: 10000,
        receivableStatus: "sent",
        now: new Date("2026-05-13T12:00:00"),
      }),
    ).toEqual({
      status: "due_now",
      label: "Due today",
      nextDate: "2026-05-13",
    });
    expect(
      nextInvoiceReminder({
        issueDate: "2026-05-01",
        dueDate: "2026-05-01",
        balanceCents: 10000,
        receivableStatus: "overdue",
        now: new Date("2026-05-13T12:00:00"),
      }).status,
    ).toBe("past_due");
  });
});
