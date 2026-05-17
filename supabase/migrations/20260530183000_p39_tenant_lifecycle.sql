ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_tenants_archived_at
  ON public.tenants (archived_at, created_at DESC);
