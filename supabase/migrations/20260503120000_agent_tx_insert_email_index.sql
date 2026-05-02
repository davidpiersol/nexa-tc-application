-- Follow-up to Step 9 guide alignment:
-- 1) Agents: INSERT on transactions within their tenant (see nexa_build_guide.md RLS summary).
-- 2) Index from_email for inbound email routing / dedup queries.

CREATE POLICY transactions_insert_agent ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () = 'agent'::public.user_role
  );

CREATE INDEX idx_email_ingestion_from_email ON public.email_ingestion (from_email);
