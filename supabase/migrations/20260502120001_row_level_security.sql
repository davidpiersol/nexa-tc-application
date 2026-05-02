-- Nexa — RLS: session helpers + one policy per table per operation

-- ---------------------------------------------------------------------------
-- Session helpers (SECURITY DEFINER: read profile without RLS recursion)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.session_tenant_id ()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT u.tenant_id
  FROM public.users u
  WHERE u.id = auth.uid ();
$$;

CREATE OR REPLACE FUNCTION public.session_role ()
  RETURNS public.user_role
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u.id = auth.uid ();
$$;

CREATE OR REPLACE FUNCTION public.user_links_transaction (p_transaction_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.transaction_parties tp
    WHERE tp.transaction_id = p_transaction_id
      AND tp.user_id = auth.uid ()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_agent_party (p_transaction_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.transaction_parties tp
    WHERE tp.transaction_id = p_transaction_id
      AND tp.user_id = auth.uid ()
      AND tp.party_role IN (
        'listing_agent'::public.party_role,
        'buyer_agent'::public.party_role
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_buyer_or_seller_party (p_transaction_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.transaction_parties tp
    WHERE tp.transaction_id = p_transaction_id
      AND tp.user_id = auth.uid ()
      AND tp.party_role IN (
        'buyer'::public.party_role,
        'seller'::public.party_role
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_mortgage_or_title_party (p_transaction_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.transaction_parties tp
    WHERE tp.transaction_id = p_transaction_id
      AND tp.user_id = auth.uid ()
      AND tp.party_role IN (
        'lender'::public.party_role,
        'title_officer'::public.party_role
      )
  );
$$;

-- JWT tenant must match database tenant when both are present
CREATE OR REPLACE FUNCTION public.tenant_scope_ok ()
  RETURNS boolean
  LANGUAGE sql
  STABLE
AS $$
  SELECT
    public.session_tenant_id () IS NOT NULL
    AND (
      public.get_user_tenant_id () IS NULL
      OR public.get_user_tenant_id () = public.session_tenant_id ()
    );
$$;

-- ---------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_ingestion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- tenants
-- ---------------------------------------------------------------------------

CREATE POLICY tenants_select ON public.tenants
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND id = public.session_tenant_id ()
  );

CREATE POLICY tenants_insert ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY tenants_update ON public.tenants
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND id = public.session_tenant_id ()
    AND public.session_role () = 'admin'::public.user_role
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND id = public.session_tenant_id ()
    AND public.session_role () = 'admin'::public.user_role
  );

CREATE POLICY tenants_delete ON public.tenants
  FOR DELETE TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE POLICY users_select ON public.users
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR id = auth.uid ()
      OR EXISTS (
        SELECT 1
        FROM public.transaction_parties tp_self
        JOIN public.transaction_parties tp_other ON tp_other.transaction_id = tp_self.transaction_id
        WHERE tp_self.user_id = auth.uid ()
          AND tp_other.user_id = public.users.id
      )
    )
  );

CREATE POLICY users_insert ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () = 'admin'::public.user_role
  );

CREATE POLICY users_update ON public.users
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () = 'admin'::public.user_role
      OR id = auth.uid ()
    )
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () = 'admin'::public.user_role
      OR id = auth.uid ()
    )
  );

CREATE POLICY users_delete ON public.users
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () = 'admin'::public.user_role
  );

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------

CREATE POLICY transactions_select ON public.transactions
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR public.user_links_transaction (id)
    )
  );

CREATE POLICY transactions_insert ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY transactions_update ON public.transactions
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY transactions_delete ON public.transactions
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

-- ---------------------------------------------------------------------------
-- transaction_parties
-- ---------------------------------------------------------------------------

CREATE POLICY transaction_parties_select ON public.transaction_parties
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR public.user_links_transaction (transaction_id)
    )
  );

CREATE POLICY transaction_parties_insert ON public.transaction_parties
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY transaction_parties_update ON public.transaction_parties
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY transaction_parties_delete ON public.transaction_parties
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------

CREATE POLICY documents_select ON public.documents
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
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

CREATE POLICY documents_insert ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR (
        public.user_is_agent_party (transaction_id)
        OR public.user_is_mortgage_or_title_party (transaction_id)
      )
    )
  );

CREATE POLICY documents_update ON public.documents
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY documents_delete ON public.documents
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

-- ---------------------------------------------------------------------------
-- checklists
-- ---------------------------------------------------------------------------

CREATE POLICY checklists_select ON public.checklists
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR public.user_links_transaction (transaction_id)
    )
  );

CREATE POLICY checklists_insert ON public.checklists
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY checklists_update ON public.checklists
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY checklists_delete ON public.checklists
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

-- ---------------------------------------------------------------------------
-- checklist_items
-- ---------------------------------------------------------------------------

CREATE POLICY checklist_items_select ON public.checklist_items
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR public.user_links_transaction (transaction_id)
    )
  );

CREATE POLICY checklist_items_insert ON public.checklist_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY checklist_items_update ON public.checklist_items
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY checklist_items_delete ON public.checklist_items
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

-- ---------------------------------------------------------------------------
-- checklist_templates
-- ---------------------------------------------------------------------------

CREATE POLICY checklist_templates_select ON public.checklist_templates
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY checklist_templates_insert ON public.checklist_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY checklist_templates_update ON public.checklist_templates
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY checklist_templates_delete ON public.checklist_templates
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

CREATE POLICY messages_select ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR public.user_links_transaction (transaction_id)
    )
  );

CREATE POLICY messages_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR public.user_links_transaction (transaction_id)
    )
  );

CREATE POLICY messages_update ON public.messages
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY messages_delete ON public.messages
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

-- ---------------------------------------------------------------------------
-- email_ingestion
-- ---------------------------------------------------------------------------

CREATE POLICY email_ingestion_select ON public.email_ingestion
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR (
        transaction_id IS NOT NULL
        AND public.user_links_transaction (transaction_id)
      )
    )
  );

CREATE POLICY email_ingestion_insert ON public.email_ingestion
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY email_ingestion_update ON public.email_ingestion
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

CREATE POLICY email_ingestion_delete ON public.email_ingestion
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------

CREATE POLICY tasks_select ON public.tasks
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR public.user_links_transaction (transaction_id)
      OR assigned_to = auth.uid ()
    )
  );

CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR public.user_is_agent_party (transaction_id)
    )
  );

CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR assigned_to = auth.uid ()
    )
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role
      )
      OR assigned_to = auth.uid ()
    )
  );

CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () IN (
      'admin'::public.user_role,
      'tc'::public.user_role
    )
  );

-- ---------------------------------------------------------------------------
-- audit_log — INSERT only (no reads or modifications via API)
-- ---------------------------------------------------------------------------

CREATE POLICY audit_log_select ON public.audit_log
  FOR SELECT TO authenticated
  USING (false);

CREATE POLICY audit_log_insert ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid ()
    AND tenant_id = public.session_tenant_id ()
    AND public.tenant_scope_ok ()
  );

CREATE POLICY audit_log_update ON public.audit_log
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY audit_log_delete ON public.audit_log
  FOR DELETE TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- api_integrations (admin only within tenant)
-- ---------------------------------------------------------------------------

CREATE POLICY api_integrations_select ON public.api_integrations
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () = 'admin'::public.user_role
  );

CREATE POLICY api_integrations_insert ON public.api_integrations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () = 'admin'::public.user_role
  );

CREATE POLICY api_integrations_update ON public.api_integrations
  FOR UPDATE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () = 'admin'::public.user_role
  )
  WITH CHECK (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () = 'admin'::public.user_role
  );

CREATE POLICY api_integrations_delete ON public.api_integrations
  FOR DELETE TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND public.session_role () = 'admin'::public.user_role
  );
