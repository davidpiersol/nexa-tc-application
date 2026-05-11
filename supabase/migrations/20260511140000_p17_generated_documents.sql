-- P17: Generated PDF storage metadata + extend documents RLS for tenant/global admins.

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS generated_from_template_version_id uuid
    REFERENCES public.global_document_template_versions (id) ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS source_data_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.documents.generated_from_template_version_id IS
  'When set, this row is a filled PDF produced from this global template version; immutable after insert.';

COMMENT ON COLUMN public.documents.source_data_snapshot IS
  'JSON snapshot of transaction/template context used at generation time (template ids + field values).';

CREATE INDEX IF NOT EXISTS idx_documents_generated_template_version
  ON public.documents (tenant_id, generated_from_template_version_id)
  WHERE generated_from_template_version_id IS NOT NULL;

-- Align privileged document roles with contacts / template selections (tenant_admin, global admins).
DROP POLICY IF EXISTS documents_select ON public.documents;
CREATE POLICY documents_select ON public.documents
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
        public.user_is_agent_party (transaction_id)
        OR public.user_is_mortgage_or_title_party (transaction_id)
      )
      OR (
        public.user_is_buyer_or_seller_party (transaction_id)
        AND (
          visible_to_client
          OR uploaded_by = auth.uid ()
        )
      )
    )
  );

DROP POLICY IF EXISTS documents_insert ON public.documents;
CREATE POLICY documents_insert ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
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
        public.user_is_agent_party (transaction_id)
        OR public.user_is_mortgage_or_title_party (transaction_id)
      )
    )
  );

DROP POLICY IF EXISTS documents_update ON public.documents;
CREATE POLICY documents_update ON public.documents
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc'
    )
  )
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
  );

DROP POLICY IF EXISTS documents_delete ON public.documents;
CREATE POLICY documents_delete ON public.documents
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc'
    )
  );
