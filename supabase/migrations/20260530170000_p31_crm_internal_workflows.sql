-- P31: User-specific internal CRM tasks, reminders, relationships, and richer touch history.

ALTER TABLE public.crm_touchpoints
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES public.users (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.users (id) ON DELETE SET NULL;

UPDATE public.crm_touchpoints
SET owner_user_id = COALESCE(owner_user_id, created_by)
WHERE owner_user_id IS NULL;

CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts (id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.transactions (id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'follow_up' CHECK (kind IN ('follow_up', 'reminder')),
  title text NOT NULL,
  description text,
  due_at timestamptz,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'archived')),
  segment text CHECK (
    segment IS NULL OR segment IN ('soi', 'hot', 'warm', 'cold', 'vendor', 'broker_client', 'prospect', 'other')
  ),
  completed_at timestamptz,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  primary_contact_id uuid REFERENCES public.contacts (id) ON DELETE SET NULL,
  related_contact_id uuid REFERENCES public.contacts (id) ON DELETE SET NULL,
  relationship_type text NOT NULL DEFAULT 'other' CHECK (
    relationship_type IN ('referral_source', 'client', 'vendor', 'broker', 'family', 'business', 'other')
  ),
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_touchpoints_owner
  ON public.crm_touchpoints (tenant_id, owner_user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_owner_due
  ON public.crm_tasks (tenant_id, owner_user_id, status, due_at);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_contact
  ON public.crm_tasks (tenant_id, contact_id, due_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_relationships_owner
  ON public.crm_relationships (tenant_id, owner_user_id, status, updated_at DESC);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_tasks_select ON public.crm_tasks;
CREATE POLICY crm_tasks_select ON public.crm_tasks
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND (
      owner_user_id = auth.uid()
      OR (public.session_is_tenant_admin() OR public.session_is_global_admin())
    )
  );

DROP POLICY IF EXISTS crm_tasks_insert ON public.crm_tasks;
CREATE POLICY crm_tasks_insert ON public.crm_tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND owner_user_id = auth.uid()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS crm_tasks_update ON public.crm_tasks;
CREATE POLICY crm_tasks_update ON public.crm_tasks
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND (
      owner_user_id = auth.uid()
      OR (public.session_is_tenant_admin() OR public.session_is_global_admin())
    )
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND (
      owner_user_id = auth.uid()
      OR (public.session_is_tenant_admin() OR public.session_is_global_admin())
    )
  );

DROP POLICY IF EXISTS crm_tasks_delete ON public.crm_tasks;
CREATE POLICY crm_tasks_delete ON public.crm_tasks
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND owner_user_id = auth.uid()
  );

DROP POLICY IF EXISTS crm_relationships_select ON public.crm_relationships;
CREATE POLICY crm_relationships_select ON public.crm_relationships
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND (
      owner_user_id = auth.uid()
      OR (public.session_is_tenant_admin() OR public.session_is_global_admin())
    )
  );

DROP POLICY IF EXISTS crm_relationships_write ON public.crm_relationships;
CREATE POLICY crm_relationships_write ON public.crm_relationships
  FOR ALL TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND owner_user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND owner_user_id = auth.uid()
  );

DROP POLICY IF EXISTS crm_touchpoints_select ON public.crm_touchpoints;
CREATE POLICY crm_touchpoints_select ON public.crm_touchpoints
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND (
      owner_user_id = auth.uid()
      OR (public.session_is_tenant_admin() OR public.session_is_global_admin())
    )
  );

DROP POLICY IF EXISTS crm_touchpoints_insert ON public.crm_touchpoints;
CREATE POLICY crm_touchpoints_insert ON public.crm_touchpoints
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND owner_user_id = auth.uid()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS crm_touchpoints_update ON public.crm_touchpoints;
CREATE POLICY crm_touchpoints_update ON public.crm_touchpoints
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND (
      owner_user_id = auth.uid()
      OR (public.session_is_tenant_admin() OR public.session_is_global_admin())
    )
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND (
      owner_user_id = auth.uid()
      OR (public.session_is_tenant_admin() OR public.session_is_global_admin())
    )
  );

DROP POLICY IF EXISTS crm_touchpoints_delete ON public.crm_touchpoints;
CREATE POLICY crm_touchpoints_delete ON public.crm_touchpoints
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND owner_user_id = auth.uid()
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_tasks TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_relationships TO authenticated, service_role;

DROP TRIGGER IF EXISTS crm_touchpoints_set_updated_at ON public.crm_touchpoints;
CREATE TRIGGER crm_touchpoints_set_updated_at
  BEFORE UPDATE ON public.crm_touchpoints
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS crm_tasks_set_updated_at ON public.crm_tasks;
CREATE TRIGGER crm_tasks_set_updated_at
  BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS crm_relationships_set_updated_at ON public.crm_relationships;
CREATE TRIGGER crm_relationships_set_updated_at
  BEFORE UPDATE ON public.crm_relationships
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

COMMENT ON TABLE public.crm_tasks IS
  'User-specific CRM follow-up tasks and reminders for Upcoming Actions and calendar views.';

COMMENT ON TABLE public.crm_relationships IS
  'User-specific CRM relationship links between canonical Choral Point contacts.';

COMMENT ON TABLE public.crm_touchpoints IS
  'User-specific CRM touch history and notes linked to canonical Choral Point contacts. External sync remains disabled until approved.';
