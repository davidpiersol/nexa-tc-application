-- P28: Provider-neutral AI architecture, feature settings, and usage tracking.

CREATE TABLE IF NOT EXISTS public.ai_feature_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants (id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  provider_key text NOT NULL DEFAULT 'disabled',
  model_key text NOT NULL DEFAULT 'disabled',
  max_output_tokens integer NOT NULL DEFAULT 1000 CHECK (max_output_tokens BETWEEN 1 AND 20000),
  monthly_budget_cents integer NOT NULL DEFAULT 0 CHECK (monthly_budget_cents >= 0),
  require_expensive_model_confirmation boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_feature_settings_feature_provider_check CHECK (
    feature_key IN (
      'intake_assist',
      'property_legal_description_assist',
      'smart_search',
      'template_mapping_suggestions',
      'package_review',
      'missing_data_explanation',
      'activity_summary',
      'task_suggestions',
      'communication_drafts',
      'help_copilot'
    )
    AND provider_key IN (
      'disabled',
      'openai',
      'anthropic',
      'google_gemini',
      'google_vertex',
      'openrouter',
      'groq'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_feature_settings_global_unique
  ON public.ai_feature_settings (feature_key)
  WHERE tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ai_feature_settings_tenant_unique
  ON public.ai_feature_settings (tenant_id, feature_key)
  WHERE tenant_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  feature_key text NOT NULL,
  provider_key text NOT NULL,
  model_key text NOT NULL,
  transaction_id uuid REFERENCES public.transactions (id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.global_document_templates (id) ON DELETE SET NULL,
  input_tokens integer CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens integer CHECK (output_tokens IS NULL OR output_tokens >= 0),
  estimated_cost_cents integer CHECK (estimated_cost_cents IS NULL OR estimated_cost_cents >= 0),
  status text NOT NULL CHECK (status IN ('success', 'failure', 'skipped')),
  error_code text,
  provider_request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_feature_settings_tenant
  ON public.ai_feature_settings (tenant_id, feature_key);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_tenant_feature_created
  ON public.ai_usage_events (tenant_id, feature_key, created_at DESC);

ALTER TABLE public.ai_feature_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_feature_settings_select ON public.ai_feature_settings;
CREATE POLICY ai_feature_settings_select ON public.ai_feature_settings
  FOR SELECT TO authenticated
  USING (
    public.session_is_global_admin()
    OR (
      tenant_id = public.session_tenant_id()
      AND (public.session_is_tenant_admin() OR public.session_role() = 'tc'::public.user_role)
    )
    OR (tenant_id IS NULL AND public.tenant_scope_ok())
  );

DROP POLICY IF EXISTS ai_feature_settings_insert ON public.ai_feature_settings;
CREATE POLICY ai_feature_settings_insert ON public.ai_feature_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.session_is_global_admin()
    OR (tenant_id = public.session_tenant_id() AND public.session_is_tenant_admin())
  );

DROP POLICY IF EXISTS ai_feature_settings_update ON public.ai_feature_settings;
CREATE POLICY ai_feature_settings_update ON public.ai_feature_settings
  FOR UPDATE TO authenticated
  USING (
    public.session_is_global_admin()
    OR (tenant_id = public.session_tenant_id() AND public.session_is_tenant_admin())
  )
  WITH CHECK (
    public.session_is_global_admin()
    OR (tenant_id = public.session_tenant_id() AND public.session_is_tenant_admin())
  );

DROP POLICY IF EXISTS ai_feature_settings_delete ON public.ai_feature_settings;
CREATE POLICY ai_feature_settings_delete ON public.ai_feature_settings
  FOR DELETE TO authenticated
  USING (
    public.session_is_global_admin()
    OR (tenant_id = public.session_tenant_id() AND public.session_is_tenant_admin())
  );

DROP POLICY IF EXISTS ai_usage_events_select ON public.ai_usage_events;
CREATE POLICY ai_usage_events_select ON public.ai_usage_events
  FOR SELECT TO authenticated
  USING (
    public.session_is_global_admin()
    OR (tenant_id = public.session_tenant_id() AND (public.session_is_tenant_admin() OR public.session_role() = 'tc'::public.user_role))
  );

DROP POLICY IF EXISTS ai_usage_events_insert ON public.ai_usage_events;
CREATE POLICY ai_usage_events_insert ON public.ai_usage_events
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.tenant_scope_ok()
    AND (user_id IS NULL OR user_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_feature_settings TO authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.ai_usage_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_usage_events TO service_role;

DROP TRIGGER IF EXISTS ai_feature_settings_set_updated_at ON public.ai_feature_settings;
CREATE TRIGGER ai_feature_settings_set_updated_at
  BEFORE UPDATE ON public.ai_feature_settings
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

COMMENT ON TABLE public.ai_feature_settings IS
  'Per-feature AI provider/model settings and budget guardrails. AI is disabled until enabled by an admin.';

COMMENT ON TABLE public.ai_usage_events IS
  'AI usage and cost audit events by tenant, feature, provider, model, and optional transaction/template context.';
