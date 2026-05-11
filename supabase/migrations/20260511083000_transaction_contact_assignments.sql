-- P12: Transaction contact assignments (Assign Vendors workflow).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'transaction_contact_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.transaction_contact_role AS ENUM (
      'vendor',
      'lender',
      'title',
      'attorney',
      'broker',
      'other'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.transaction_contact_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  assignment_role public.transaction_contact_role NOT NULL DEFAULT 'vendor',
  assignment_category public.contact_category,
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transaction_contact_assignments_unique
    UNIQUE (transaction_id, contact_id, assignment_role)
);

CREATE INDEX IF NOT EXISTS idx_transaction_contact_assignments_tenant_tx
  ON public.transaction_contact_assignments (tenant_id, transaction_id, assignment_role);
CREATE INDEX IF NOT EXISTS idx_transaction_contact_assignments_contact
  ON public.transaction_contact_assignments (contact_id);

DROP TRIGGER IF EXISTS transaction_contact_assignments_set_updated_at
  ON public.transaction_contact_assignments;
CREATE TRIGGER transaction_contact_assignments_set_updated_at
  BEFORE UPDATE ON public.transaction_contact_assignments
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.transaction_contact_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transaction_contact_assignments_select ON public.transaction_contact_assignments;
CREATE POLICY transaction_contact_assignments_select
  ON public.transaction_contact_assignments
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
  );

DROP POLICY IF EXISTS transaction_contact_assignments_insert ON public.transaction_contact_assignments;
CREATE POLICY transaction_contact_assignments_insert
  ON public.transaction_contact_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc'
    )
  );

DROP POLICY IF EXISTS transaction_contact_assignments_update ON public.transaction_contact_assignments;
CREATE POLICY transaction_contact_assignments_update
  ON public.transaction_contact_assignments
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc'
    )
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc'
    )
  );

DROP POLICY IF EXISTS transaction_contact_assignments_delete ON public.transaction_contact_assignments;
CREATE POLICY transaction_contact_assignments_delete
  ON public.transaction_contact_assignments
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc'
    )
  );

COMMENT ON TABLE public.transaction_contact_assignments IS
  'Tenant transaction to canonical contact mapping for vendor/service-provider assignment.';
