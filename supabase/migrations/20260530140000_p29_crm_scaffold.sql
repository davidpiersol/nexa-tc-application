-- P29: CRM-lite boundaries and disabled external CRM sync scaffolding.

CREATE TABLE IF NOT EXISTS public.crm_touchpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions (id) ON DELETE SET NULL,
  touch_type text NOT NULL CHECK (touch_type IN ('note', 'call', 'email', 'meeting', 'task', 'import')),
  direction text CHECK (direction IS NULL OR direction IN ('inbound', 'outbound', 'internal')),
  body text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_external_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
  provider_key text NOT NULL CHECK (provider_key IN ('deltanet', 'lofty', 'follow_up_boss', 'moxiworks')),
  external_id text NOT NULL,
  sync_enabled boolean NOT NULL DEFAULT false,
  sync_status text NOT NULL DEFAULT 'disabled' CHECK (sync_status IN ('disabled', 'pending_mapping', 'ready', 'error')),
  last_synced_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_external_links_unique UNIQUE (tenant_id, provider_key, external_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_touchpoints_tenant_contact
  ON public.crm_touchpoints (tenant_id, contact_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_external_links_tenant_contact
  ON public.crm_external_links (tenant_id, contact_id, provider_key);

ALTER TABLE public.crm_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_external_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_touchpoints_select ON public.crm_touchpoints;
CREATE POLICY crm_touchpoints_select ON public.crm_touchpoints
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND public.session_role() IN ('admin'::public.user_role, 'tc'::public.user_role, 'agent'::public.user_role)
  );

DROP POLICY IF EXISTS crm_touchpoints_insert ON public.crm_touchpoints;
CREATE POLICY crm_touchpoints_insert ON public.crm_touchpoints
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND public.session_role() IN ('admin'::public.user_role, 'tc'::public.user_role, 'agent'::public.user_role)
    AND (created_by IS NULL OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS crm_touchpoints_update ON public.crm_touchpoints;
CREATE POLICY crm_touchpoints_update ON public.crm_touchpoints
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND public.session_role() IN ('admin'::public.user_role, 'tc'::public.user_role)
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND public.session_role() IN ('admin'::public.user_role, 'tc'::public.user_role)
  );

DROP POLICY IF EXISTS crm_external_links_select ON public.crm_external_links;
CREATE POLICY crm_external_links_select ON public.crm_external_links
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND public.session_role() IN ('admin'::public.user_role, 'tc'::public.user_role)
  );

DROP POLICY IF EXISTS crm_external_links_write ON public.crm_external_links;
CREATE POLICY crm_external_links_write ON public.crm_external_links
  FOR ALL TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND public.session_role() IN ('admin'::public.user_role, 'tc'::public.user_role)
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND public.session_role() IN ('admin'::public.user_role, 'tc'::public.user_role)
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_touchpoints TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_external_links TO authenticated, service_role;

DROP TRIGGER IF EXISTS crm_external_links_set_updated_at ON public.crm_external_links;
CREATE TRIGGER crm_external_links_set_updated_at
  BEFORE UPDATE ON public.crm_external_links
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

COMMENT ON TABLE public.crm_touchpoints IS
  'CRM-lite contact touch history. External provider sync remains disabled until approved.';

COMMENT ON TABLE public.crm_external_links IS
  'External CRM IDs and disabled sync state for provider adapters such as DeltaNET, Lofty, Follow Up Boss, and MoxiWorks.';
