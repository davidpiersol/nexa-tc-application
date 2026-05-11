-- P11: shared contacts, broker-client filtering, and broker profile foundations.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'contact_category' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.contact_category AS ENUM (
      'broker',
      'vendor',
      'lender',
      'title',
      'attorney',
      'tc',
      'soi',
      'other'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  company text,
  is_broker_client boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_category_assignments (
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category public.contact_category NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, category)
);

CREATE TABLE IF NOT EXISTS public.broker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  signing_platform text,
  signing_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT broker_profiles_contact_unique UNIQUE (contact_id)
);

CREATE TABLE IF NOT EXISTS public.broker_profile_credentials (
  broker_profile_id uuid PRIMARY KEY REFERENCES public.broker_profiles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL,
  credentials_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_name
  ON public.contacts (tenant_id, full_name);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_broker_client
  ON public.contacts (tenant_id, is_broker_client);
CREATE INDEX IF NOT EXISTS idx_contact_category_assignments_tenant
  ON public.contact_category_assignments (tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_broker_profiles_tenant_contact
  ON public.broker_profiles (tenant_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_broker_profile_credentials_tenant
  ON public.broker_profile_credentials (tenant_id);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_profile_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_select ON public.contacts;
DROP POLICY IF EXISTS contacts_insert ON public.contacts;
DROP POLICY IF EXISTS contacts_update ON public.contacts;
DROP POLICY IF EXISTS contacts_delete ON public.contacts;

CREATE POLICY contacts_select ON public.contacts
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

CREATE POLICY contacts_insert ON public.contacts
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

CREATE POLICY contacts_update ON public.contacts
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

CREATE POLICY contacts_delete ON public.contacts
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

DROP POLICY IF EXISTS contact_category_assignments_select ON public.contact_category_assignments;
DROP POLICY IF EXISTS contact_category_assignments_insert ON public.contact_category_assignments;
DROP POLICY IF EXISTS contact_category_assignments_update ON public.contact_category_assignments;
DROP POLICY IF EXISTS contact_category_assignments_delete ON public.contact_category_assignments;

CREATE POLICY contact_category_assignments_select ON public.contact_category_assignments
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

CREATE POLICY contact_category_assignments_insert ON public.contact_category_assignments
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

CREATE POLICY contact_category_assignments_update ON public.contact_category_assignments
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

CREATE POLICY contact_category_assignments_delete ON public.contact_category_assignments
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

DROP POLICY IF EXISTS broker_profiles_select ON public.broker_profiles;
DROP POLICY IF EXISTS broker_profiles_insert ON public.broker_profiles;
DROP POLICY IF EXISTS broker_profiles_update ON public.broker_profiles;
DROP POLICY IF EXISTS broker_profiles_delete ON public.broker_profiles;

CREATE POLICY broker_profiles_select ON public.broker_profiles
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

CREATE POLICY broker_profiles_insert ON public.broker_profiles
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

CREATE POLICY broker_profiles_update ON public.broker_profiles
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

CREATE POLICY broker_profiles_delete ON public.broker_profiles
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

DROP POLICY IF EXISTS broker_profile_credentials_select ON public.broker_profile_credentials;
DROP POLICY IF EXISTS broker_profile_credentials_insert ON public.broker_profile_credentials;
DROP POLICY IF EXISTS broker_profile_credentials_update ON public.broker_profile_credentials;
DROP POLICY IF EXISTS broker_profile_credentials_delete ON public.broker_profile_credentials;

CREATE POLICY broker_profile_credentials_select ON public.broker_profile_credentials
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
    )
  );

CREATE POLICY broker_profile_credentials_insert ON public.broker_profile_credentials
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
    )
  );

CREATE POLICY broker_profile_credentials_update ON public.broker_profile_credentials
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
    )
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
    )
  );

CREATE POLICY broker_profile_credentials_delete ON public.broker_profile_credentials
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_is_global_admin()
      OR public.session_is_tenant_admin()
    )
  );
