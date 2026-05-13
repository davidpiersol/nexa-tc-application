-- P20: Package rules (seller/buyer/title) and AI-assisted template mapping suggestions.

CREATE TABLE IF NOT EXISTS public.document_package_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  package_kind text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_package_rules_kind_check
    CHECK (package_kind IN ('seller', 'buyer', 'title'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_document_package_rules_global_slug
  ON public.document_package_rules (slug)
  WHERE tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_document_package_rules_tenant_slug
  ON public.document_package_rules (tenant_id, slug)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_document_package_rules_kind_active
  ON public.document_package_rules (package_kind, is_active)
  WHERE tenant_id IS NULL;

CREATE TABLE IF NOT EXISTS public.document_package_rule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.document_package_rules(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  item_type text NOT NULL,
  global_document_template_id uuid REFERENCES public.global_document_templates(id) ON DELETE SET NULL,
  placeholder_label text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_package_rule_items_type_check
    CHECK (item_type IN ('global_template', 'broker_upload', 'title_upload')),
  CONSTRAINT document_package_rule_items_shape_check
    CHECK (
      (
        item_type = 'global_template'
        AND global_document_template_id IS NOT NULL
        AND placeholder_label IS NULL
      )
      OR (
        item_type IN ('broker_upload', 'title_upload')
        AND placeholder_label IS NOT NULL
        AND trim(placeholder_label) <> ''
        AND global_document_template_id IS NULL
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_document_package_rule_items_rule
  ON public.document_package_rule_items (rule_id, sort_order);

CREATE TABLE IF NOT EXISTS public.global_document_template_mapping_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_id uuid NOT NULL
    REFERENCES public.global_document_template_versions(id) ON DELETE CASCADE,
  suggested_mappings jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric,
  status text NOT NULL DEFAULT 'pending',
  model_name text,
  rationale text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT global_document_template_mapping_suggestions_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'superseded')),
  CONSTRAINT global_document_template_mapping_suggestions_confidence_check
    CHECK (confidence IS NULL OR (confidence >= 0::numeric AND confidence <= 1::numeric))
);

CREATE INDEX IF NOT EXISTS idx_global_mapping_suggestions_version_status
  ON public.global_document_template_mapping_suggestions (template_version_id, status);

COMMENT ON TABLE public.document_package_rules IS
  'Platform or tenant-scoped document package definitions (seller, buyer, title).';

COMMENT ON TABLE public.document_package_rule_items IS
  'Ordered package contents: global NMAR templates and broker/title upload placeholders.';

COMMENT ON TABLE public.global_document_template_mapping_suggestions IS
  'AI-proposed AcroForm mappings; never applied until a global admin reviews and approves.';

DROP TRIGGER IF EXISTS document_package_rules_set_updated_at ON public.document_package_rules;
CREATE TRIGGER document_package_rules_set_updated_at
  BEFORE UPDATE ON public.document_package_rules
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.document_package_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_package_rule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_document_template_mapping_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_package_rules_select ON public.document_package_rules;
CREATE POLICY document_package_rules_select
  ON public.document_package_rules
  FOR SELECT TO authenticated
  USING (
    public.session_is_global_admin()
    OR (
      tenant_id IS NULL
      AND (
        public.session_is_tenant_admin()
        OR public.session_role()::text IN ('tc', 'admin')
      )
    )
    OR (
      tenant_id IS NOT NULL
      AND tenant_id = public.session_tenant_id()
      AND (
        public.session_is_tenant_admin()
        OR public.session_role()::text IN ('tc', 'admin')
      )
    )
  );

DROP POLICY IF EXISTS document_package_rules_insert ON public.document_package_rules;
CREATE POLICY document_package_rules_insert
  ON public.document_package_rules
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      tenant_id IS NULL
      AND public.session_is_global_admin()
    )
    OR (
      tenant_id IS NOT NULL
      AND tenant_id = public.session_tenant_id()
      AND (
        public.session_is_global_admin()
        OR public.session_is_tenant_admin()
      )
    )
  );

DROP POLICY IF EXISTS document_package_rules_update ON public.document_package_rules;
CREATE POLICY document_package_rules_update
  ON public.document_package_rules
  FOR UPDATE TO authenticated
  USING (
    (
      tenant_id IS NULL
      AND public.session_is_global_admin()
    )
    OR (
      tenant_id IS NOT NULL
      AND tenant_id = public.session_tenant_id()
      AND (
        public.session_is_global_admin()
        OR public.session_is_tenant_admin()
      )
    )
  )
  WITH CHECK (
    (
      tenant_id IS NULL
      AND public.session_is_global_admin()
    )
    OR (
      tenant_id IS NOT NULL
      AND tenant_id = public.session_tenant_id()
      AND (
        public.session_is_global_admin()
        OR public.session_is_tenant_admin()
      )
    )
  );

DROP POLICY IF EXISTS document_package_rules_delete ON public.document_package_rules;
CREATE POLICY document_package_rules_delete
  ON public.document_package_rules
  FOR DELETE TO authenticated
  USING (
    (
      tenant_id IS NULL
      AND public.session_is_global_admin()
    )
    OR (
      tenant_id IS NOT NULL
      AND tenant_id = public.session_tenant_id()
      AND (
        public.session_is_global_admin()
        OR public.session_is_tenant_admin()
      )
    )
  );

DROP POLICY IF EXISTS document_package_rule_items_select ON public.document_package_rule_items;
CREATE POLICY document_package_rule_items_select
  ON public.document_package_rule_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.document_package_rules r
      WHERE r.id = rule_id
        AND (
          public.session_is_global_admin()
          OR (
            r.tenant_id IS NULL
            AND (
              public.session_is_tenant_admin()
              OR public.session_role()::text IN ('tc', 'admin')
            )
          )
          OR (
            r.tenant_id IS NOT NULL
            AND r.tenant_id = public.session_tenant_id()
            AND (
              public.session_is_tenant_admin()
              OR public.session_role()::text IN ('tc', 'admin')
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS document_package_rule_items_insert ON public.document_package_rule_items;
CREATE POLICY document_package_rule_items_insert
  ON public.document_package_rule_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.document_package_rules r
      WHERE r.id = rule_id
        AND (
          (
            r.tenant_id IS NULL
            AND public.session_is_global_admin()
          )
          OR (
            r.tenant_id IS NOT NULL
            AND r.tenant_id = public.session_tenant_id()
            AND (
              public.session_is_global_admin()
              OR public.session_is_tenant_admin()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS document_package_rule_items_update ON public.document_package_rule_items;
CREATE POLICY document_package_rule_items_update
  ON public.document_package_rule_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.document_package_rules r
      WHERE r.id = rule_id
        AND (
          (
            r.tenant_id IS NULL
            AND public.session_is_global_admin()
          )
          OR (
            r.tenant_id IS NOT NULL
            AND r.tenant_id = public.session_tenant_id()
            AND (
              public.session_is_global_admin()
              OR public.session_is_tenant_admin()
            )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.document_package_rules r
      WHERE r.id = rule_id
        AND (
          (
            r.tenant_id IS NULL
            AND public.session_is_global_admin()
          )
          OR (
            r.tenant_id IS NOT NULL
            AND r.tenant_id = public.session_tenant_id()
            AND (
              public.session_is_global_admin()
              OR public.session_is_tenant_admin()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS document_package_rule_items_delete ON public.document_package_rule_items;
CREATE POLICY document_package_rule_items_delete
  ON public.document_package_rule_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.document_package_rules r
      WHERE r.id = rule_id
        AND (
          (
            r.tenant_id IS NULL
            AND public.session_is_global_admin()
          )
          OR (
            r.tenant_id IS NOT NULL
            AND r.tenant_id = public.session_tenant_id()
            AND (
              public.session_is_global_admin()
              OR public.session_is_tenant_admin()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS global_document_template_mapping_suggestions_select
  ON public.global_document_template_mapping_suggestions;
CREATE POLICY global_document_template_mapping_suggestions_select
  ON public.global_document_template_mapping_suggestions
  FOR SELECT TO authenticated
  USING (public.session_is_global_admin());

DROP POLICY IF EXISTS global_document_template_mapping_suggestions_insert
  ON public.global_document_template_mapping_suggestions;
CREATE POLICY global_document_template_mapping_suggestions_insert
  ON public.global_document_template_mapping_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (public.session_is_global_admin());

DROP POLICY IF EXISTS global_document_template_mapping_suggestions_update
  ON public.global_document_template_mapping_suggestions;
CREATE POLICY global_document_template_mapping_suggestions_update
  ON public.global_document_template_mapping_suggestions
  FOR UPDATE TO authenticated
  USING (public.session_is_global_admin())
  WITH CHECK (public.session_is_global_admin());

DROP POLICY IF EXISTS global_document_template_mapping_suggestions_delete
  ON public.global_document_template_mapping_suggestions;
CREATE POLICY global_document_template_mapping_suggestions_delete
  ON public.global_document_template_mapping_suggestions
  FOR DELETE TO authenticated
  USING (public.session_is_global_admin());
