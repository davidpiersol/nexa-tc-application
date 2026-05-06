-- audit_row_change referenced NEW.transaction_id inside one CASE expression.
-- Postgres validates record fields against the firing table (e.g. tenants has no transaction_id).
-- Dispatch with IF/ELSIF so we never touch columns that do not exist on that table.

CREATE OR REPLACE FUNCTION public.audit_row_change ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
  v_tx uuid;
  v_rid uuid;
BEGIN
  v_tenant := COALESCE(NEW.tenant_id, OLD.tenant_id);
  v_rid := COALESCE(NEW.id, OLD.id);

  IF TG_TABLE_NAME = 'transactions' THEN
    v_tx := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME IN (
    'transaction_parties',
    'documents',
    'checklists',
    'checklist_items',
    'messages',
    'email_ingestion',
    'tasks'
  ) THEN
    v_tx := COALESCE(NEW.transaction_id, OLD.transaction_id);
  ELSE
    -- tenants, users, checklist_templates, api_integrations — no transaction scope
    v_tx := NULL;
  END IF;

  INSERT INTO public.audit_log (
    tenant_id,
    transaction_id,
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    actor_id,
    created_at,
    updated_at
  )
  VALUES (
    v_tenant,
    v_tx,
    TG_TABLE_NAME,
    v_rid,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb (OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb (NEW) ELSE NULL END,
    auth.uid (),
    now(),
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;
