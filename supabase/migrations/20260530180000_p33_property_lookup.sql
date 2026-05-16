-- P33 statewide New Mexico property lookup scaffold
CREATE TABLE IF NOT EXISTS public.property_data_county_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL DEFAULT 'NM',
  county_name text NOT NULL,
  county_fips text,
  portal_type text NOT NULL DEFAULT 'unknown',
  search_url text,
  api_base_url text,
  supported_lookup_keys text[] NOT NULL DEFAULT '{}',
  structured_api_available boolean NOT NULL DEFAULT false,
  automation_allowed boolean NOT NULL DEFAULT false,
  requires_auth boolean NOT NULL DEFAULT false,
  terms_review_status text NOT NULL DEFAULT 'not_reviewed',
  notes text,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_data_county_sources_unique UNIQUE (state, county_name),
  CONSTRAINT property_data_county_sources_terms_check CHECK (terms_review_status IN ('not_reviewed','approved','blocked'))
);

CREATE TABLE IF NOT EXISTS public.property_lookup_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source_kind text NOT NULL,
  source_label text NOT NULL,
  county_source_id uuid REFERENCES public.property_data_county_sources(id) ON DELETE SET NULL,
  query_type text NOT NULL,
  normalized_query text NOT NULL,
  status text NOT NULL,
  retrieved_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  missing_fields text[] NOT NULL DEFAULT '{}',
  raw_snapshot jsonb,
  source_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_lookup_runs_status_check CHECK (status IN ('success','manual_required','failed'))
);

CREATE TABLE IF NOT EXISTS public.property_lookup_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE,
  lookup_run_id uuid NOT NULL REFERENCES public.property_lookup_runs(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  suggested_value text NOT NULL,
  source_kind text NOT NULL,
  confidence numeric(5,2),
  source_notes text,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at timestamptz,
  rejected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_lookup_runs_tenant_created ON public.property_lookup_runs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_lookup_suggestions_tenant_tx ON public.property_lookup_suggestions (tenant_id, transaction_id);

ALTER TABLE public.property_data_county_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_lookup_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_lookup_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY property_data_county_sources_select ON public.property_data_county_sources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY property_lookup_runs_select ON public.property_lookup_runs
  FOR SELECT TO authenticated USING (tenant_id = public.session_tenant_id());
CREATE POLICY property_lookup_runs_insert ON public.property_lookup_runs
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.session_tenant_id());

CREATE POLICY property_lookup_suggestions_select ON public.property_lookup_suggestions
  FOR SELECT TO authenticated USING (tenant_id = public.session_tenant_id());
CREATE POLICY property_lookup_suggestions_insert ON public.property_lookup_suggestions
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.session_tenant_id());
CREATE POLICY property_lookup_suggestions_update ON public.property_lookup_suggestions
  FOR UPDATE TO authenticated USING (tenant_id = public.session_tenant_id())
  WITH CHECK (tenant_id = public.session_tenant_id());

INSERT INTO public.property_data_county_sources
  (county_name, county_fips, portal_type, search_url, supported_lookup_keys, structured_api_available, automation_allowed, requires_auth, terms_review_status, notes)
VALUES
  ('Valencia', '35061', 'eagleweb', 'https://eagleweb.co.valencia.nm.us/assessor/web/', ARRAY['address','parcel','owner'], false, false, false, 'not_reviewed', 'Registry entry only; do not automate until terms and reliability are approved.'),
  ('Bernalillo', '35001', 'manual_only', 'https://www.bernco.gov/assessor/', ARRAY['address','parcel','owner'], false, false, false, 'not_reviewed', 'Manual fallback until a reviewed structured source is approved.')
ON CONFLICT (state, county_name) DO NOTHING;
