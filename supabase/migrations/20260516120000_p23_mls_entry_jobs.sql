-- P23: MLS-only job scaffolding.
-- Separate from full TC transactions so buyer-side closing workflow does not leak into MLS entry work.

CREATE TABLE IF NOT EXISTS public.mls_entry_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft',
  billing_status text NOT NULL DEFAULT 'not_invoiced',
  requested_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  requesting_broker_contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  requesting_broker_name text,
  listing_broker_contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  listing_broker_name text,
  listing_client_contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  listing_client_name text,
  seller_names text,
  property_address text,
  property_legal_description text,
  property_type text,
  parcel_number text,
  acreage text,
  list_price numeric,
  mls_number text,
  general_notes text,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mls_entry_jobs_status_check CHECK (
    status IN ('draft', 'ready_for_entry', 'submitted', 'completed', 'cancelled')
  ),
  CONSTRAINT mls_entry_jobs_billing_status_check CHECK (
    billing_status IN ('not_invoiced', 'ready_to_invoice', 'invoiced', 'paid', 'waived')
  )
);

CREATE INDEX IF NOT EXISTS idx_mls_entry_jobs_tenant_updated
  ON public.mls_entry_jobs (tenant_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_mls_entry_jobs_tenant_status
  ON public.mls_entry_jobs (tenant_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_mls_entry_jobs_requested_by
  ON public.mls_entry_jobs (tenant_id, requested_by);

DROP TRIGGER IF EXISTS mls_entry_jobs_set_updated_at ON public.mls_entry_jobs;
CREATE TRIGGER mls_entry_jobs_set_updated_at
  BEFORE UPDATE ON public.mls_entry_jobs
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.mls_entry_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mls_entry_jobs_select ON public.mls_entry_jobs;
CREATE POLICY mls_entry_jobs_select
  ON public.mls_entry_jobs
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
      OR public.session_role()::text IN ('tc', 'admin')
      OR requested_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS mls_entry_jobs_insert ON public.mls_entry_jobs;
CREATE POLICY mls_entry_jobs_insert
  ON public.mls_entry_jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
      OR public.session_role()::text IN ('tc', 'admin')
    )
  );

DROP POLICY IF EXISTS mls_entry_jobs_update ON public.mls_entry_jobs;
CREATE POLICY mls_entry_jobs_update
  ON public.mls_entry_jobs
  FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS mls_entry_jobs_delete ON public.mls_entry_jobs;
CREATE POLICY mls_entry_jobs_delete
  ON public.mls_entry_jobs
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.session_is_global_admin()
  );

COMMENT ON TABLE public.mls_entry_jobs IS
  'MLS-only service jobs. These are not full TC-to-close transactions and intentionally exclude buyer-side workflow by default.';

COMMENT ON COLUMN public.mls_entry_jobs.source_payload IS
  'Reserved for future MLS/FlexMLS/SWMLS API payload drafting. Do not write to MLS from this field without confirmed write access.';
