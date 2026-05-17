-- P22: Broker assignment-based access + conservative party messaging/doc visibility.

CREATE OR REPLACE FUNCTION public.user_broker_assigned_via_contact (p_transaction_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.transaction_contact_assignments tca
    INNER JOIN public.contacts c
      ON c.id = tca.contact_id
      AND c.tenant_id = tca.tenant_id
    INNER JOIN public.users u
      ON u.id = auth.uid ()
      AND u.tenant_id = public.session_tenant_id ()
    WHERE tca.transaction_id = p_transaction_id
      AND tca.tenant_id = public.session_tenant_id ()
      AND tca.assignment_role = 'broker'
      AND c.email IS NOT NULL
      AND length(trim(c.email)) > 0
      AND lower(trim(c.email)) = lower(trim(u.email))
      AND public.session_role () IN ('broker'::public.user_role, 'agent'::public.user_role)
  );
$$;

COMMENT ON FUNCTION public.user_broker_assigned_via_contact (uuid) IS
  'True when the signed-in broker/agent matches a broker-role transaction_contact_assignments row via contact email.';

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
  )
  OR (
    public.session_role () IN ('broker'::public.user_role, 'agent'::public.user_role)
    AND public.user_broker_assigned_via_contact (p_transaction_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_broker_assigned_via_contact (uuid) TO authenticated;

DROP POLICY IF EXISTS documents_select ON public.documents;

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
      OR (
        public.session_role () IN ('broker'::public.user_role, 'agent'::public.user_role)
        AND public.user_broker_assigned_via_contact (transaction_id)
        AND visible_to_client
      )
    )
  );

DROP POLICY IF EXISTS messages_select ON public.messages;

CREATE POLICY messages_select ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.tenant_scope_ok ()
    AND tenant_id = public.session_tenant_id ()
    AND (
      public.session_role () IN (
        'admin'::public.user_role,
        'tc'::public.user_role,
        'superadmin'::public.user_role,
        'tenant_admin'::public.user_role,
        'global_admin'::public.user_role
      )
      OR (
        public.user_links_transaction (transaction_id)
        AND messages.is_internal IS NOT TRUE
      )
    )
  );

DROP POLICY IF EXISTS broker_profiles_update ON public.broker_profiles;

CREATE POLICY broker_profiles_update ON public.broker_profiles
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.session_tenant_id ()
    AND (
      public.session_role ()::text IN (
        'global_admin',
        'superadmin',
        'tenant_admin',
        'admin',
        'tc'
      )
      OR (
        public.session_role () IN ('broker'::public.user_role, 'agent'::public.user_role)
        AND EXISTS (
          SELECT 1
          FROM public.contacts c
          INNER JOIN public.users u ON u.id = auth.uid ()
          WHERE c.id = broker_profiles.contact_id
            AND c.tenant_id = public.session_tenant_id ()
            AND c.email IS NOT NULL
            AND lower(trim(c.email)) = lower(trim(u.email))
        )
      )
    )
  )
  WITH CHECK (
    tenant_id = public.session_tenant_id ()
    AND (
      public.session_role ()::text IN (
        'global_admin',
        'superadmin',
        'tenant_admin',
        'admin',
        'tc'
      )
      OR (
        public.session_role () IN ('broker'::public.user_role, 'agent'::public.user_role)
        AND EXISTS (
          SELECT 1
          FROM public.contacts c
          INNER JOIN public.users u ON u.id = auth.uid ()
          WHERE c.id = broker_profiles.contact_id
            AND c.tenant_id = public.session_tenant_id ()
            AND c.email IS NOT NULL
            AND lower(trim(c.email)) = lower(trim(u.email))
        )
      )
    )
  );
