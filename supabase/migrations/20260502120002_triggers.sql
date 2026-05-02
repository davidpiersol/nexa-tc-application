-- Nexa — updated_at maintenance + immutable audit_log rows + audit trail triggers

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_set_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER transactions_set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER transaction_parties_set_updated_at
  BEFORE UPDATE ON public.transaction_parties
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER documents_set_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER checklists_set_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER checklist_items_set_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER checklist_templates_set_updated_at
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER messages_set_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER email_ingestion_set_updated_at
  BEFORE UPDATE ON public.email_ingestion
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER api_integrations_set_updated_at
  BEFORE UPDATE ON public.api_integrations
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

-- audit_log is append-only via policy; keep updated_at equal on INSERT only
CREATE OR REPLACE FUNCTION public.prevent_audit_log_update ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log rows cannot be updated or deleted';
END;
$$;

CREATE TRIGGER audit_log_prevent_update
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_audit_log_update ();

CREATE TRIGGER audit_log_prevent_delete
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_audit_log_update ();

-- ---------------------------------------------------------------------------
-- Audit row capture (INSERT / UPDATE / DELETE on business tables)
-- ---------------------------------------------------------------------------

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

  v_tx := CASE TG_TABLE_NAME
    WHEN 'transactions' THEN COALESCE(NEW.id, OLD.id)
    WHEN 'transaction_parties' THEN COALESCE(NEW.transaction_id, OLD.transaction_id)
    WHEN 'documents' THEN COALESCE(NEW.transaction_id, OLD.transaction_id)
    WHEN 'checklists' THEN COALESCE(NEW.transaction_id, OLD.transaction_id)
    WHEN 'checklist_items' THEN COALESCE(NEW.transaction_id, OLD.transaction_id)
    WHEN 'messages' THEN COALESCE(NEW.transaction_id, OLD.transaction_id)
    WHEN 'email_ingestion' THEN COALESCE(NEW.transaction_id, OLD.transaction_id)
    WHEN 'tasks' THEN COALESCE(NEW.transaction_id, OLD.transaction_id)
    ELSE NULL
  END;

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

CREATE TRIGGER tenants_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();

CREATE TRIGGER users_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();

CREATE TRIGGER transactions_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();

CREATE TRIGGER transaction_parties_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.transaction_parties
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();

CREATE TRIGGER documents_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();

CREATE TRIGGER checklists_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.checklists
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();

CREATE TRIGGER checklist_items_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.checklist_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();

CREATE TRIGGER checklist_templates_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.checklist_templates
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();

CREATE TRIGGER messages_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();

CREATE TRIGGER email_ingestion_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.email_ingestion
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();

CREATE TRIGGER tasks_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();

CREATE TRIGGER api_integrations_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.api_integrations
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_row_change ();
