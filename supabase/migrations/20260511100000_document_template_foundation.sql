-- P13: Document checklist and global template foundation.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'template_selection_state' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.template_selection_state AS ENUM (
      'required',
      'optional',
      'default',
      'unavailable',
      'pending_licensed_copy'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'template_availability_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.template_availability_status AS ENUM (
      'available',
      'unavailable',
      'pending_licensed_copy'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.global_document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_number text NOT NULL,
  title text NOT NULL,
  category public.document_category NOT NULL DEFAULT 'other',
  jurisdiction_state text NOT NULL DEFAULT 'NM',
  availability_status public.template_availability_status NOT NULL DEFAULT 'pending_licensed_copy',
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT global_document_templates_form_unique UNIQUE (form_number, jurisdiction_state)
);

CREATE TABLE IF NOT EXISTS public.global_document_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.global_document_templates(id) ON DELETE CASCADE,
  version_label text NOT NULL,
  source_file_name text,
  storage_path text NOT NULL,
  checksum_sha256 text,
  is_current boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT global_document_template_versions_unique UNIQUE (template_id, version_label),
  CONSTRAINT global_document_template_versions_pdf_path_check
    CHECK (
      storage_path ~ '^templates/global/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[^/]+\\.pdf$'
    )
);

CREATE TABLE IF NOT EXISTS public.transaction_document_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.global_document_templates(id) ON DELETE RESTRICT,
  template_version_id uuid REFERENCES public.global_document_template_versions(id) ON DELETE SET NULL,
  selection_state public.template_selection_state NOT NULL DEFAULT 'optional',
  document_status public.document_status NOT NULL DEFAULT 'missing',
  notes text,
  added_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transaction_document_selections_unique
    UNIQUE (transaction_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_global_document_templates_active
  ON public.global_document_templates (is_active, availability_status, category);
CREATE INDEX IF NOT EXISTS idx_global_document_template_versions_template
  ON public.global_document_template_versions (template_id, is_current, is_active);
CREATE INDEX IF NOT EXISTS idx_transaction_document_selections_tx
  ON public.transaction_document_selections (tenant_id, transaction_id, selection_state);
CREATE INDEX IF NOT EXISTS idx_transaction_document_selections_status
  ON public.transaction_document_selections (tenant_id, document_status);

DROP TRIGGER IF EXISTS global_document_templates_set_updated_at
  ON public.global_document_templates;
CREATE TRIGGER global_document_templates_set_updated_at
  BEFORE UPDATE ON public.global_document_templates
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS global_document_template_versions_set_updated_at
  ON public.global_document_template_versions;
CREATE TRIGGER global_document_template_versions_set_updated_at
  BEFORE UPDATE ON public.global_document_template_versions
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS transaction_document_selections_set_updated_at
  ON public.transaction_document_selections;
CREATE TRIGGER transaction_document_selections_set_updated_at
  BEFORE UPDATE ON public.transaction_document_selections
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.global_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_document_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_document_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS global_document_templates_select
  ON public.global_document_templates;
CREATE POLICY global_document_templates_select
  ON public.global_document_templates
  FOR SELECT TO authenticated
  USING (
    public.session_is_global_admin()
    OR public.session_is_tenant_admin()
    OR public.session_role()::text IN ('tc', 'admin')
  );

DROP POLICY IF EXISTS global_document_templates_insert
  ON public.global_document_templates;
CREATE POLICY global_document_templates_insert
  ON public.global_document_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.session_is_global_admin());

DROP POLICY IF EXISTS global_document_templates_update
  ON public.global_document_templates;
CREATE POLICY global_document_templates_update
  ON public.global_document_templates
  FOR UPDATE TO authenticated
  USING (public.session_is_global_admin())
  WITH CHECK (public.session_is_global_admin());

DROP POLICY IF EXISTS global_document_templates_delete
  ON public.global_document_templates;
CREATE POLICY global_document_templates_delete
  ON public.global_document_templates
  FOR DELETE TO authenticated
  USING (public.session_is_global_admin());

DROP POLICY IF EXISTS global_document_template_versions_select
  ON public.global_document_template_versions;
CREATE POLICY global_document_template_versions_select
  ON public.global_document_template_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.global_document_templates t
      WHERE t.id = template_id
        AND (
          public.session_is_global_admin()
          OR public.session_is_tenant_admin()
          OR public.session_role()::text IN ('tc', 'admin')
        )
    )
  );

DROP POLICY IF EXISTS global_document_template_versions_insert
  ON public.global_document_template_versions;
CREATE POLICY global_document_template_versions_insert
  ON public.global_document_template_versions
  FOR INSERT TO authenticated
  WITH CHECK (public.session_is_global_admin());

DROP POLICY IF EXISTS global_document_template_versions_update
  ON public.global_document_template_versions;
CREATE POLICY global_document_template_versions_update
  ON public.global_document_template_versions
  FOR UPDATE TO authenticated
  USING (public.session_is_global_admin())
  WITH CHECK (public.session_is_global_admin());

DROP POLICY IF EXISTS global_document_template_versions_delete
  ON public.global_document_template_versions;
CREATE POLICY global_document_template_versions_delete
  ON public.global_document_template_versions
  FOR DELETE TO authenticated
  USING (public.session_is_global_admin());

DROP POLICY IF EXISTS transaction_document_selections_select
  ON public.transaction_document_selections;
CREATE POLICY transaction_document_selections_select
  ON public.transaction_document_selections
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND (
      public.session_role()::text IN (
        'global_admin',
        'superadmin',
        'tenant_admin',
        'admin',
        'tc'
      )
      OR public.user_links_transaction(transaction_id)
    )
  );

DROP POLICY IF EXISTS transaction_document_selections_insert
  ON public.transaction_document_selections;
CREATE POLICY transaction_document_selections_insert
  ON public.transaction_document_selections
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc'
    )
  );

DROP POLICY IF EXISTS transaction_document_selections_update
  ON public.transaction_document_selections;
CREATE POLICY transaction_document_selections_update
  ON public.transaction_document_selections
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc'
    )
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc'
    )
  );

DROP POLICY IF EXISTS transaction_document_selections_delete
  ON public.transaction_document_selections;
CREATE POLICY transaction_document_selections_delete
  ON public.transaction_document_selections
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.session_tenant_id()
    AND public.session_role()::text IN (
      'global_admin',
      'superadmin',
      'tenant_admin',
      'admin',
      'tc'
    )
  );

COMMENT ON TABLE public.global_document_templates IS
  'Global template catalog; not tenant-scoped.';
COMMENT ON TABLE public.global_document_template_versions IS
  'Template file versions stored at templates/global/{template_id}/{version_id}/{safe_filename}.pdf.';
COMMENT ON TABLE public.transaction_document_selections IS
  'Tenant transaction document checklist selections that reference global templates.';
