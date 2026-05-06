ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS intake_data jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.transactions.intake_data IS
  'TC intake field dictionary values (grouped by provider sections).';
