-- Realtime + TC audit visibility + attachments bucket + DocuSign ↔ checklist bridge

-- ---------------------------------------------------------------------------
-- Allow TC / admin to read audit rows (IP / UA in API inserts — integration tests)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_log_select ON public.audit_log;

CREATE POLICY audit_log_select ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

-- ---------------------------------------------------------------------------
-- DocuSign webhook → document row lookup + checklist completion
-- ---------------------------------------------------------------------------
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS docusign_envelope_id text;

CREATE INDEX IF NOT EXISTS idx_documents_docusign_envelope
  ON public.documents (tenant_id, docusign_envelope_id)
  WHERE docusign_envelope_id IS NOT NULL;

ALTER TABLE public.checklist_items
  ADD COLUMN IF NOT EXISTS linked_document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Supabase Realtime (Postgres changes → clients)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'checklist_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_items;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Storage: private bucket + tenant-scoped paths (`{tenant_id}/...`)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO UPDATE SET public = excluded.public;

DROP POLICY IF EXISTS attachments_objects_insert ON storage.objects;
DROP POLICY IF EXISTS attachments_objects_select ON storage.objects;
DROP POLICY IF EXISTS attachments_objects_update ON storage.objects;
DROP POLICY IF EXISTS attachments_objects_delete ON storage.objects;

CREATE POLICY attachments_objects_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND split_part (name, '/', 1) = public.session_tenant_id ()::text
  );

CREATE POLICY attachments_objects_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND split_part (name, '/', 1) = public.session_tenant_id ()::text
  );

CREATE POLICY attachments_objects_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND split_part (name, '/', 1) = public.session_tenant_id ()::text
  )
  WITH CHECK (
    bucket_id = 'attachments'
    AND split_part (name, '/', 1) = public.session_tenant_id ()::text
  );

CREATE POLICY attachments_objects_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND split_part (name, '/', 1) = public.session_tenant_id ()::text
  );
