-- P14 hardening: restrict transaction contact assignment reads to privileged users
-- or users linked to the transaction.

DROP POLICY IF EXISTS transaction_contact_assignments_select
  ON public.transaction_contact_assignments;

CREATE POLICY transaction_contact_assignments_select
  ON public.transaction_contact_assignments
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
