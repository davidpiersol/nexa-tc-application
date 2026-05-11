-- CRM scaffolding: canonical companies and contact/company linking.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'company_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.company_type AS ENUM (
      'brokerage',
      'lender',
      'title',
      'vendor',
      'attorney',
      'other'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  company_type public.company_type NOT NULL DEFAULT 'other',
  website text,
  phone text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT companies_tenant_name_unique UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS public.contact_company_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'employee',
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_company_primary_unique
  ON public.contact_company_links (contact_id)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_companies_tenant_type
  ON public.companies (tenant_id, company_type, name);
CREATE INDEX IF NOT EXISTS idx_contact_company_links_tenant
  ON public.contact_company_links (tenant_id, company_id, contact_id);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_company_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_select ON public.companies;
DROP POLICY IF EXISTS companies_insert ON public.companies;
DROP POLICY IF EXISTS companies_update ON public.companies;
DROP POLICY IF EXISTS companies_delete ON public.companies;

CREATE POLICY companies_select ON public.companies
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc',
      'broker',
      'agent'
    )
  );

CREATE POLICY companies_insert ON public.companies
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

CREATE POLICY companies_update ON public.companies
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

CREATE POLICY companies_delete ON public.companies
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin'
    )
  );

DROP POLICY IF EXISTS contact_company_links_select ON public.contact_company_links;
DROP POLICY IF EXISTS contact_company_links_insert ON public.contact_company_links;
DROP POLICY IF EXISTS contact_company_links_update ON public.contact_company_links;
DROP POLICY IF EXISTS contact_company_links_delete ON public.contact_company_links;

CREATE POLICY contact_company_links_select ON public.contact_company_links
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc',
      'broker',
      'agent'
    )
  );

CREATE POLICY contact_company_links_insert ON public.contact_company_links
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

CREATE POLICY contact_company_links_update ON public.contact_company_links
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

CREATE POLICY contact_company_links_delete ON public.contact_company_links
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin'
    )
  );
