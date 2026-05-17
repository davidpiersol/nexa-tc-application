-- P21: Document workflow events (packet export + signing lifecycle audit).

CREATE TABLE IF NOT EXISTS public.document_workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  event_kind text NOT NULL,
  signing_provider_slug text NOT NULL DEFAULT 'neutral_manual',
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_workflow_events_kind_check
    CHECK (event_kind IN ('packet_export', 'sent_for_signature'))
);

CREATE INDEX IF NOT EXISTS idx_document_workflow_events_tx
  ON public.document_workflow_events (tenant_id, transaction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_workflow_events_doc
  ON public.document_workflow_events (document_id, created_at DESC);

COMMENT ON TABLE public.document_workflow_events IS
  'Workflow log for packet exports and signing initiation (provider-neutral slug + detail).';

ALTER TABLE public.document_workflow_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_workflow_events_select ON public.document_workflow_events;

CREATE POLICY document_workflow_events_select ON public.document_workflow_events
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role()::text IN (
        'global_admin',
        'superadmin',
        'tenant_admin',
        'admin',
        'tc'
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.documents d
          WHERE d.id = document_id
            AND (
              public.user_is_agent_party (d.transaction_id)
              OR public.user_is_mortgage_or_title_party (d.transaction_id)
              OR (
                public.user_is_buyer_or_seller_party (d.transaction_id)
                AND d.visible_to_client
              )
            )
        )
      )
    )
  );

DROP POLICY IF EXISTS document_workflow_events_insert ON public.document_workflow_events;

CREATE POLICY document_workflow_events_insert ON public.document_workflow_events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc'
    )
    AND EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.id = document_workflow_events.document_id
        AND d.tenant_id = public.session_tenant_id ()
        AND d.transaction_id = document_workflow_events.transaction_id
    )
  );
