CREATE TABLE IF NOT EXISTS public.uat_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  current_url text,
  severity text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uat_issues_issue_type_check CHECK (issue_type IN ('bug','enhancement')),
  CONSTRAINT uat_issues_severity_check CHECK (severity IS NULL OR severity IN ('low','medium','high','blocking')),
  CONSTRAINT uat_issues_status_check CHECK (status IN ('new','triaged','planned','closed'))
);

CREATE INDEX IF NOT EXISTS idx_uat_issues_tenant_created
  ON public.uat_issues (tenant_id, created_at DESC);

ALTER TABLE public.uat_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY uat_issues_insert ON public.uat_issues
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.session_tenant_id() AND submitted_by = auth.uid());

CREATE POLICY uat_issues_select_own ON public.uat_issues
  FOR SELECT TO authenticated
  USING (tenant_id = public.session_tenant_id() AND submitted_by = auth.uid());

CREATE POLICY uat_issues_select_admin ON public.uat_issues
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.session_role() IN ('admin','tenant_admin','tc','global_admin','superadmin')
  );
