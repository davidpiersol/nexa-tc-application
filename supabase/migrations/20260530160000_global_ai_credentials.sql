-- P28 patch: global-admin managed AI credentials.
-- Stores platform-level provider keys encrypted at rest; never exposes secret values to clients.

CREATE TABLE IF NOT EXISTS public.global_provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  credentials_json jsonb NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT global_provider_credentials_provider_unique UNIQUE (provider),
  CONSTRAINT global_provider_credentials_provider_check CHECK (
    provider IN (
      'ai_openai',
      'ai_anthropic',
      'ai_google_gemini',
      'ai_google_vertex',
      'ai_openrouter',
      'ai_groq',
      'ai_xai_grok'
    )
  )
);

ALTER TABLE public.global_provider_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS global_provider_credentials_select ON public.global_provider_credentials;
CREATE POLICY global_provider_credentials_select ON public.global_provider_credentials
  FOR SELECT TO authenticated
  USING (public.session_is_global_admin());

DROP POLICY IF EXISTS global_provider_credentials_insert ON public.global_provider_credentials;
CREATE POLICY global_provider_credentials_insert ON public.global_provider_credentials
  FOR INSERT TO authenticated
  WITH CHECK (public.session_is_global_admin());

DROP POLICY IF EXISTS global_provider_credentials_update ON public.global_provider_credentials;
CREATE POLICY global_provider_credentials_update ON public.global_provider_credentials
  FOR UPDATE TO authenticated
  USING (public.session_is_global_admin())
  WITH CHECK (public.session_is_global_admin());

DROP POLICY IF EXISTS global_provider_credentials_delete ON public.global_provider_credentials;
CREATE POLICY global_provider_credentials_delete ON public.global_provider_credentials
  FOR DELETE TO authenticated
  USING (public.session_is_global_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.global_provider_credentials TO authenticated, service_role;

DROP TRIGGER IF EXISTS global_provider_credentials_set_updated_at ON public.global_provider_credentials;
CREATE TRIGGER global_provider_credentials_set_updated_at
  BEFORE UPDATE ON public.global_provider_credentials
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

COMMENT ON TABLE public.global_provider_credentials IS
  'Platform-level encrypted provider credentials managed only by global admins.';
