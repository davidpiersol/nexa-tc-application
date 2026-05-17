-- P24: Billing and invoicing scaffolding.
-- This tracks receivables for TC services. It does not implement tax filing,
-- payment processing, or provider-specific accounting sync.

CREATE TABLE IF NOT EXISTS public.billing_service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  default_amount_cents integer NOT NULL DEFAULT 0 CHECK (default_amount_cents >= 0),
  taxable boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_service_types_code_check CHECK (
    code IN ('full_tc_transaction', 'mls_only_job', 'custom')
  ),
  CONSTRAINT billing_service_types_tenant_code_key UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_number text,
  status text NOT NULL DEFAULT 'draft',
  receivable_status text NOT NULL DEFAULT 'not_sent',
  broker_contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  broker_name text,
  source_transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  source_mls_entry_job_id uuid REFERENCES public.mls_entry_jobs(id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_at timestamptz,
  subtotal_cents integer NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  tax_cents integer NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  balance_cents integer NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  accounting_provider text,
  accounting_external_id text,
  accounting_sync_status text NOT NULL DEFAULT 'not_configured',
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_invoices_status_check CHECK (
    status IN ('draft', 'sent', 'paid', 'void', 'cancelled')
  ),
  CONSTRAINT billing_invoices_receivable_status_check CHECK (
    receivable_status IN ('not_sent', 'sent', 'partially_paid', 'paid', 'overdue', 'void')
  ),
  CONSTRAINT billing_invoices_accounting_sync_status_check CHECK (
    accounting_sync_status IN ('not_configured', 'ready', 'synced', 'failed', 'manual')
  ),
  CONSTRAINT billing_invoices_one_source_check CHECK (
    source_transaction_id IS NULL OR source_mls_entry_job_id IS NULL
  )
);

CREATE TABLE IF NOT EXISTS public.billing_invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  service_type_id uuid REFERENCES public.billing_service_types(id) ON DELETE SET NULL,
  service_code text NOT NULL DEFAULT 'custom',
  description text NOT NULL,
  quantity numeric(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_amount_cents integer NOT NULL DEFAULT 0 CHECK (unit_amount_cents >= 0),
  line_total_cents integer NOT NULL DEFAULT 0 CHECK (line_total_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_invoice_line_items_service_code_check CHECK (
    service_code IN ('full_tc_transaction', 'mls_only_job', 'custom')
  )
);

CREATE INDEX IF NOT EXISTS idx_billing_service_types_tenant_active
  ON public.billing_service_types (tenant_id, active, code);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_tenant_updated
  ON public.billing_invoices (tenant_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_tenant_status
  ON public.billing_invoices (tenant_id, receivable_status, issue_date DESC);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_transaction
  ON public.billing_invoices (tenant_id, source_transaction_id);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_mls_job
  ON public.billing_invoices (tenant_id, source_mls_entry_job_id);

CREATE INDEX IF NOT EXISTS idx_billing_invoice_line_items_invoice
  ON public.billing_invoice_line_items (tenant_id, invoice_id);

DROP TRIGGER IF EXISTS billing_service_types_set_updated_at ON public.billing_service_types;
CREATE TRIGGER billing_service_types_set_updated_at
  BEFORE UPDATE ON public.billing_service_types
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS billing_invoices_set_updated_at ON public.billing_invoices;
CREATE TRIGGER billing_invoices_set_updated_at
  BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS billing_invoice_line_items_set_updated_at ON public.billing_invoice_line_items;
CREATE TRIGGER billing_invoice_line_items_set_updated_at
  BEFORE UPDATE ON public.billing_invoice_line_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.billing_service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoice_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_service_types_select ON public.billing_service_types;
CREATE POLICY billing_service_types_select
  ON public.billing_service_types
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
      OR public.session_role()::text IN ('tc', 'admin')
    )
  );

DROP POLICY IF EXISTS billing_service_types_write ON public.billing_service_types;
CREATE POLICY billing_service_types_write
  ON public.billing_service_types
  FOR ALL TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
      OR public.session_role()::text IN ('tc', 'admin')
    )
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
      OR public.session_role()::text IN ('tc', 'admin')
    )
  );

DROP POLICY IF EXISTS billing_invoices_select ON public.billing_invoices;
CREATE POLICY billing_invoices_select
  ON public.billing_invoices
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
      OR public.session_role()::text IN ('tc', 'admin')
    )
  );

DROP POLICY IF EXISTS billing_invoices_write ON public.billing_invoices;
CREATE POLICY billing_invoices_write
  ON public.billing_invoices
  FOR ALL TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
      OR public.session_role()::text IN ('tc', 'admin')
    )
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
      OR public.session_role()::text IN ('tc', 'admin')
    )
  );

DROP POLICY IF EXISTS billing_invoice_line_items_select ON public.billing_invoice_line_items;
CREATE POLICY billing_invoice_line_items_select
  ON public.billing_invoice_line_items
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
      OR public.session_role()::text IN ('tc', 'admin')
    )
  );

DROP POLICY IF EXISTS billing_invoice_line_items_write ON public.billing_invoice_line_items;
CREATE POLICY billing_invoice_line_items_write
  ON public.billing_invoice_line_items
  FOR ALL TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
      OR public.session_role()::text IN ('tc', 'admin')
    )
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
      OR public.session_role()::text IN ('tc', 'admin')
    )
  );

INSERT INTO public.billing_service_types (tenant_id, code, name, description, default_amount_cents)
SELECT id, 'full_tc_transaction', 'Full TC transaction', 'Transaction coordination from listing/contract through close.', 0
FROM public.tenants
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO public.billing_service_types (tenant_id, code, name, description, default_amount_cents)
SELECT id, 'mls_only_job', 'MLS-only entry', 'Listing-entry service that does not include full TC-to-close work.', 0
FROM public.tenants
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO public.billing_service_types (tenant_id, code, name, description, default_amount_cents)
SELECT id, 'custom', 'Custom service', 'Manual billing item for one-off services.', 0
FROM public.tenants
ON CONFLICT (tenant_id, code) DO NOTHING;

COMMENT ON TABLE public.billing_invoices IS
  'Tenant-scoped invoice/receivable scaffolding for Choral Point services. Provider sync and tax filing are intentionally not automated in P24.';

COMMENT ON COLUMN public.billing_invoices.accounting_sync_status IS
  'Tracks readiness for future QuickBooks, Profit Power, or payment-provider integration; P24 does not sync externally.';
