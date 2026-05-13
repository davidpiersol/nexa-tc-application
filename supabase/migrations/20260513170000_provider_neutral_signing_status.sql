ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS signing_provider_slug text,
  ADD COLUMN IF NOT EXISTS signing_envelope_id text,
  ADD COLUMN IF NOT EXISTS signing_envelope_status text,
  ADD COLUMN IF NOT EXISTS signing_envelope_status_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS signing_provider_url text,
  ADD COLUMN IF NOT EXISTS signing_delivery_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS signing_last_sync_error text;

UPDATE public.documents
SET
  signing_provider_slug = COALESCE(signing_provider_slug, 'docusign_api'),
  signing_envelope_id = COALESCE(signing_envelope_id, docusign_envelope_id),
  signing_envelope_status = COALESCE(signing_envelope_status, 'sent')
WHERE docusign_envelope_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS documents_signing_envelope_idx
  ON public.documents (tenant_id, signing_provider_slug, signing_envelope_id)
  WHERE signing_envelope_id IS NOT NULL;

