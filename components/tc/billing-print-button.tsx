"use client";

export function BillingPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-brand-md bg-brand-gold px-4 py-2 font-display font-semibold text-brand-navy"
    >
      Print
    </button>
  );
}
