-- P24.1: Billing usability, tax-rate tracking, invoice reminders, and reporting scaffold.

ALTER TABLE public.billing_invoices
  ADD COLUMN IF NOT EXISTS tax_rate_basis_points integer NOT NULL DEFAULT 0 CHECK (tax_rate_basis_points >= 0),
  ADD COLUMN IF NOT EXISTS payment_terms text NOT NULL DEFAULT 'due_on_receipt',
  ADD COLUMN IF NOT EXISTS reminder_schedule jsonb NOT NULL DEFAULT '[0,30,60,90]'::jsonb,
  ADD COLUMN IF NOT EXISTS next_reminder_due_at date,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS emailed_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_delivery_status text NOT NULL DEFAULT 'not_configured';

ALTER TABLE public.billing_invoices
  DROP CONSTRAINT IF EXISTS billing_invoices_payment_terms_check,
  ADD CONSTRAINT billing_invoices_payment_terms_check CHECK (
    payment_terms IN ('due_on_receipt', 'net_30', 'custom')
  );

ALTER TABLE public.billing_invoices
  DROP CONSTRAINT IF EXISTS billing_invoices_email_delivery_status_check,
  ADD CONSTRAINT billing_invoices_email_delivery_status_check CHECK (
    email_delivery_status IN ('not_configured', 'drafted', 'sent', 'failed', 'manual')
  );

UPDATE public.billing_invoices
SET
  due_date = COALESCE(due_date, issue_date),
  payment_terms = COALESCE(payment_terms, 'due_on_receipt'),
  reminder_schedule = COALESCE(reminder_schedule, '[0,30,60,90]'::jsonb)
WHERE due_date IS NULL
  OR payment_terms IS NULL
  OR reminder_schedule IS NULL;

CREATE INDEX IF NOT EXISTS idx_billing_invoices_tenant_reminders
  ON public.billing_invoices (tenant_id, receivable_status, due_date, next_reminder_due_at)
  WHERE balance_cents > 0;

COMMENT ON COLUMN public.billing_invoices.tax_rate_basis_points IS
  'Temporary integer tax-rate storage created by P24.1; renamed to exact tax_rate_percent by the follow-up precision migration.';

COMMENT ON COLUMN public.billing_invoices.reminder_schedule IS
  'Invoice follow-up offsets in days from due_date, defaulting to payable upon receipt plus 30/60/90 reminders.';

COMMENT ON COLUMN public.billing_invoices.email_delivery_status IS
  'Tracks local email/scaffold status. External email/accounting provider delivery is not automated in P24.1.';
