CREATE TABLE IF NOT EXISTS public.user_role_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_role_memberships_user_role_unique UNIQUE (user_id, role)
);

INSERT INTO public.user_role_memberships (tenant_id, user_id, role)
SELECT tenant_id, id, role
FROM public.users
ON CONFLICT (user_id, role) DO NOTHING;

ALTER TABLE public.user_role_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_role_memberships_select_own ON public.user_role_memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_role_memberships_select_admin ON public.user_role_memberships
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN ('admin', 'tenant_admin', 'global_admin', 'superadmin')
  );
