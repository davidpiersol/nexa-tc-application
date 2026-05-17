-- Supabase Data API hardening (May/Oct 2026 behavior change).
--
-- Supabase no longer exposes newly-created public tables to PostgREST/GraphQL
-- through implicit default privileges. Keep table reachability explicit here,
-- while row/action authorization remains enforced by each table's RLS policies.
--
-- Choral Point does not require broad unauthenticated table access. Anonymous
-- invite/signup flows validate JWTs or use API routes instead of direct table
-- reads, so this migration intentionally does not grant public table privileges
-- to anon.

-- Normalize inherited/default Supabase grants first. Older local/remote projects
-- may already have broad anon/authenticated privileges, so grants alone are not
-- enough to express the intended access model.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO authenticated, service_role;

REVOKE ALL PRIVILEGES ON TABLE
  public.api_integrations,
  public.audit_log,
  public.billing_invoice_line_items,
  public.billing_invoices,
  public.billing_service_types,
  public.broker_profile_credentials,
  public.broker_profiles,
  public.checklist_items,
  public.checklist_templates,
  public.checklists,
  public.companies,
  public.contact_category_assignments,
  public.contact_company_links,
  public.contacts,
  public.document_package_rule_items,
  public.document_package_rules,
  public.document_workflow_events,
  public.documents,
  public.email_ingestion,
  public.global_document_template_mapping_suggestions,
  public.global_document_template_versions,
  public.global_document_templates,
  public.global_resource_registry,
  public.messages,
  public.mls_entry_jobs,
  public.tasks,
  public.tenant_access_requests,
  public.tenant_admin_assignments,
  public.tenants,
  public.transaction_contact_assignments,
  public.transaction_document_selections,
  public.transaction_parties,
  public.transactions,
  public.users
FROM authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.api_integrations,
  public.billing_invoice_line_items,
  public.billing_invoices,
  public.billing_service_types,
  public.broker_profile_credentials,
  public.broker_profiles,
  public.checklist_items,
  public.checklist_templates,
  public.checklists,
  public.companies,
  public.contact_category_assignments,
  public.contact_company_links,
  public.contacts,
  public.document_package_rule_items,
  public.document_package_rules,
  public.document_workflow_events,
  public.documents,
  public.email_ingestion,
  public.global_document_template_mapping_suggestions,
  public.global_document_template_versions,
  public.global_document_templates,
  public.global_resource_registry,
  public.messages,
  public.mls_entry_jobs,
  public.tasks,
  public.tenant_access_requests,
  public.tenant_admin_assignments,
  public.tenants,
  public.transaction_contact_assignments,
  public.transaction_document_selections,
  public.transaction_parties,
  public.transactions,
  public.users
TO authenticated, service_role;

-- audit_log is append-only through authenticated API calls. Existing RLS and
-- triggers already prevent reads, updates, and deletes; keep the grant layer
-- aligned so future Supabase Data API behavior is explicit too.
GRANT INSERT ON TABLE public.audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_log TO service_role;

-- Keep policy helper functions available to authenticated requests evaluated by
-- PostgREST. user_broker_assigned_via_contact already had a focused grant in
-- P22; this makes the policy helper set explicit and reproducible for new
-- projects.
REVOKE EXECUTE ON FUNCTION public.session_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.session_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.tenant_scope_ok() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_links_transaction(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_is_agent_party(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_is_buyer_or_seller_party(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_is_mortgage_or_title_party(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_broker_assigned_via_contact(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.session_is_global_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.session_is_tenant_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.session_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.session_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tenant_scope_ok() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_links_transaction(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_is_agent_party(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_is_buyer_or_seller_party(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_is_mortgage_or_title_party(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_broker_assigned_via_contact(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.session_is_global_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.session_is_tenant_admin() TO authenticated, service_role;

-- Future-proof newly-created public tables/functions. RLS must still be enabled
-- and policies must still be added in each feature migration before use.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;
