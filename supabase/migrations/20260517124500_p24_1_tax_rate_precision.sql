-- P24.1 precision correction: store the exact invoice tax percent used.

ALTER TABLE public.billing_invoices
  RENAME COLUMN tax_rate_basis_points TO tax_rate_percent;

ALTER TABLE public.billing_invoices
  ALTER COLUMN tax_rate_percent TYPE numeric(7, 3)
  USING ROUND((tax_rate_percent::numeric / 100), 3);

ALTER TABLE public.billing_invoices
  ALTER COLUMN tax_rate_percent SET DEFAULT 0,
  DROP CONSTRAINT IF EXISTS billing_invoices_tax_rate_basis_points_check,
  ADD CONSTRAINT billing_invoices_tax_rate_percent_check CHECK (
    tax_rate_percent >= 0 AND tax_rate_percent <= 20
  );

COMMENT ON COLUMN public.billing_invoices.tax_rate_percent IS
  'Exact invoice tax rate percent captured at creation time, for example 4.875.';
