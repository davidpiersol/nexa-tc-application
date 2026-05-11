-- P15: Admin template upload/versioning + fillable field detection metadata.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'template_version_review_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.template_version_review_status AS ENUM (
      'needs_review',
      'approved',
      'rejected'
    );
  END IF;
END $$;

ALTER TABLE public.global_document_template_versions
  ADD COLUMN IF NOT EXISTS review_status public.template_version_review_status NOT NULL DEFAULT 'needs_review',
  ADD COLUMN IF NOT EXISTS fillable_field_names jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP INDEX IF EXISTS idx_global_document_template_versions_current_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_global_document_template_versions_current_unique
  ON public.global_document_template_versions (template_id)
  WHERE is_current = true;

COMMENT ON COLUMN public.global_document_template_versions.review_status IS
  'Version review state; new uploads default to needs_review until mappings are approved.';
COMMENT ON COLUMN public.global_document_template_versions.fillable_field_names IS
  'Detected AcroForm field names when available.';
