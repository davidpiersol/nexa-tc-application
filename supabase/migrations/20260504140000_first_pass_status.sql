ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS first_pass_status text;

COMMENT ON COLUMN public.transactions.first_pass_status IS 'pending | in_review | approved | rejected | null';
