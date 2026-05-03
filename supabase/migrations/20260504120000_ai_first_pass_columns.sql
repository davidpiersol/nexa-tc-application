-- AI First Pass workflow: property / MLS+ATTOM blobs, per-document Claude extraction, merged scores.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transaction_type text,
  ADD COLUMN IF NOT EXISTS property_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS first_pass_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS first_pass_scores jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS ai_extracted jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.checklist_templates
  ADD COLUMN IF NOT EXISTS transaction_type text;

COMMENT ON COLUMN public.transactions.property_data IS 'MLS, ATTOM, and related property blobs (see Inngest aiFirstPass).';
COMMENT ON COLUMN public.transactions.first_pass_data IS 'Merged structured first-pass payload (parties, property, dates, financial, contingencies, other).';
COMMENT ON COLUMN public.transactions.first_pass_scores IS 'Per-section / field confidence scores from merge step.';
COMMENT ON COLUMN public.documents.ai_extracted IS 'Claude extraction JSON from AI First Pass document step.';
COMMENT ON COLUMN public.checklist_templates.transaction_type IS 'Match to transactions.transaction_type when instantiating checklist; NULL = default template.';
