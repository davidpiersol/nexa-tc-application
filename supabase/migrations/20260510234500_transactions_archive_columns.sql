-- P10: archive workflow metadata for transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS closed_at timestamptz,
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES public.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS transactions_archived_at_idx
  ON public.transactions (tenant_id, archived_at DESC);
