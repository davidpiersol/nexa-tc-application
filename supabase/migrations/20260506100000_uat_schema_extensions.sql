-- UAT / product: financial fields, document status, message channel, task priority

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS purchase_price numeric(14, 2),
  ADD COLUMN IF NOT EXISTS earnest_money numeric(14, 2),
  ADD COLUMN IF NOT EXISTS contract_date date,
  ADD COLUMN IF NOT EXISTS tc_id uuid REFERENCES public.users (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.transactions.purchase_price IS 'Contract purchase price (USD).';
COMMENT ON COLUMN public.transactions.earnest_money IS 'Earnest money deposit (USD).';
COMMENT ON COLUMN public.transactions.contract_date IS 'Contract acceptance / binding date.';
COMMENT ON COLUMN public.transactions.tc_id IS 'Assigned transaction coordinator (public.users.id).';

DO $$
BEGIN
  ALTER TYPE public.document_status ADD VALUE 'sent_for_signature';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.messages.is_internal IS 'true = TC/internal-only; false = visible to transaction parties.';

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('high', 'medium', 'low'));
