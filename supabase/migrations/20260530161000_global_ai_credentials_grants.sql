-- Tighten Data API grants for global AI credentials after table creation.
-- RLS still restricts access to global admins only.

REVOKE ALL ON TABLE public.global_provider_credentials FROM anon;
REVOKE ALL ON TABLE public.global_provider_credentials FROM authenticated;
REVOKE ALL ON TABLE public.global_provider_credentials FROM service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.global_provider_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.global_provider_credentials TO service_role;
