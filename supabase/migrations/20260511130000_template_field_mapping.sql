-- P16: Template field mapping and canonical field picker metadata.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'template_mapping_review_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.template_mapping_review_status AS ENUM (
      'needs_review',
      'approved'
    );
  END IF;
END $$;

ALTER TABLE public.global_document_template_versions
  ADD COLUMN IF NOT EXISTS field_mappings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS mapping_review_status public.template_mapping_review_status NOT NULL DEFAULT 'needs_review',
  ADD COLUMN IF NOT EXISTS mapping_reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mapping_reviewed_at timestamptz;

COMMENT ON COLUMN public.global_document_template_versions.field_mappings IS
  'Per-version map of PDF field names to canonical transaction/intake field keys.';
COMMENT ON COLUMN public.global_document_template_versions.mapping_review_status IS
  'Mapping review gate for current-version promotion.';
