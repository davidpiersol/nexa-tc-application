-- P7 scaffolding: tenant admin / global admin boundaries, seat limits, invite approvals.
-- Additive migration to avoid breaking existing auth and transaction behavior.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'tenant_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'global_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'broker';

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seat_limit integer NOT NULL DEFAULT 25,
  ADD CONSTRAINT tenants_seat_limit_check CHECK (seat_limit > 0);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'access_request_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.access_request_status AS ENUM ('pending', 'approved', 'revoked', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tenant_admin_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  revoked_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.tenant_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  desired_role public.user_role NOT NULL,
  requested_auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.access_request_status NOT NULL DEFAULT 'pending',
  requested_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  revoked_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.global_resource_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL,
  key text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT global_resource_registry_type_key_unique UNIQUE (resource_type, key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_access_requests_tenant_status
  ON public.tenant_access_requests (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_access_requests_email
  ON public.tenant_access_requests (email);
CREATE INDEX IF NOT EXISTS idx_tenant_admin_assignments_tenant
  ON public.tenant_admin_assignments (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_admin_assignments_active_unique
  ON public.tenant_admin_assignments (tenant_id, user_id)
  WHERE revoked_at IS NULL;

CREATE OR REPLACE FUNCTION public.session_is_global_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(public.session_role()::text IN (
    'global_admin',
    'superadmin'
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.session_is_tenant_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(public.session_role()::text IN (
    'tenant_admin',
    'admin'
  ), false);
$$;

ALTER TABLE public.tenant_admin_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_resource_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_admin_assignments_select ON public.tenant_admin_assignments
  FOR SELECT TO authenticated
  USING (
    public.session_is_global_admin()
    OR (tenant_id = public.session_tenant_id() AND public.session_is_tenant_admin())
  );

CREATE POLICY tenant_admin_assignments_insert ON public.tenant_admin_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.session_is_global_admin());

CREATE POLICY tenant_admin_assignments_update ON public.tenant_admin_assignments
  FOR UPDATE TO authenticated
  USING (public.session_is_global_admin())
  WITH CHECK (public.session_is_global_admin());

CREATE POLICY tenant_access_requests_select ON public.tenant_access_requests
  FOR SELECT TO authenticated
  USING (
    public.session_is_global_admin()
    OR (tenant_id = public.session_tenant_id() AND public.session_is_tenant_admin())
  );

CREATE POLICY tenant_access_requests_insert ON public.tenant_access_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      tenant_id = public.session_tenant_id()
      AND public.session_is_tenant_admin()
      AND desired_role::text NOT IN (
        'global_admin',
        'superadmin',
        'tenant_admin'
      )
    )
    OR public.session_is_global_admin()
  );

CREATE POLICY tenant_access_requests_update ON public.tenant_access_requests
  FOR UPDATE TO authenticated
  USING (
    public.session_is_global_admin()
    OR (tenant_id = public.session_tenant_id() AND public.session_is_tenant_admin())
  )
  WITH CHECK (
    public.session_is_global_admin()
    OR (tenant_id = public.session_tenant_id() AND public.session_is_tenant_admin())
  );

CREATE POLICY global_resource_registry_select ON public.global_resource_registry
  FOR SELECT TO authenticated
  USING (public.session_is_global_admin() OR public.session_is_tenant_admin());

CREATE POLICY global_resource_registry_insert ON public.global_resource_registry
  FOR INSERT TO authenticated
  WITH CHECK (public.session_is_global_admin());

CREATE POLICY global_resource_registry_update ON public.global_resource_registry
  FOR UPDATE TO authenticated
  USING (public.session_is_global_admin())
  WITH CHECK (public.session_is_global_admin());

CREATE POLICY global_resource_registry_delete ON public.global_resource_registry
  FOR DELETE TO authenticated
  USING (public.session_is_global_admin());

COMMENT ON TABLE public.tenant_admin_assignments IS
  'Global-admin controlled tenant admin assignments.';
COMMENT ON TABLE public.tenant_access_requests IS
  'Tenant-scoped invite/approval queue with seat-limit enforcement done in API.';
COMMENT ON TABLE public.global_resource_registry IS
  'Platform-level catalogs (templates/providers/property source metadata).';

