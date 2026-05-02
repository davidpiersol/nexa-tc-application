-- Nexa — core schema: enums, tables, indexes, helper functions (no RLS)

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUMs
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'tc',
  'agent',
  'buyer',
  'seller',
  'mortgage',
  'title'
);

CREATE TYPE public.transaction_status AS ENUM (
  'draft',
  'active',
  'under_contract',
  'pending_close',
  'closed',
  'cancelled'
);

CREATE TYPE public.document_status AS ENUM (
  'missing',
  'requested',
  'uploaded',
  'under_review',
  'approved',
  'rejected'
);

CREATE TYPE public.document_category AS ENUM (
  'contract',
  'disclosure',
  'title',
  'mortgage',
  'inspection',
  'hoa',
  'other'
);

CREATE TYPE public.party_role AS ENUM (
  'buyer',
  'seller',
  'listing_agent',
  'buyer_agent',
  'transaction_coordinator',
  'lender',
  'title_officer',
  'other'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL GENERATED ALWAYS AS (id) STORED,
  name text NOT NULL,
  slug text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenants_slug_unique UNIQUE (slug)
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.user_role NOT NULL,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email)
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  status public.transaction_status NOT NULL DEFAULT 'draft',
  close_date date,
  property_address text,
  mls_number text,
  notes text,
  transaction_email text,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transaction_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  party_role public.party_role NOT NULL,
  display_name text,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  category public.document_category NOT NULL DEFAULT 'other',
  status public.document_status NOT NULL DEFAULT 'requested',
  file_name text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  checklist_id uuid NOT NULL REFERENCES public.checklists (id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  due_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  template_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  sender_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.email_ingestion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions (id) ON DELETE SET NULL,
  from_email text NOT NULL,
  subject text,
  body_preview text,
  raw_headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  matched_transaction_id uuid REFERENCES public.transactions (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.users (id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions (id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id uuid,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.api_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  provider text NOT NULL,
  credentials_json jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT api_integrations_tenant_provider_unique UNIQUE (tenant_id, provider)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_users_tenant_id ON public.users (tenant_id);
CREATE INDEX idx_users_email ON public.users (email);

CREATE INDEX idx_transactions_tenant_id ON public.transactions (tenant_id);
CREATE INDEX idx_transactions_status ON public.transactions (status);
CREATE INDEX idx_transactions_close_date ON public.transactions (close_date DESC NULLS LAST);

CREATE INDEX idx_transaction_parties_tenant_id ON public.transaction_parties (tenant_id);
CREATE INDEX idx_transaction_parties_transaction_id ON public.transaction_parties (transaction_id);

CREATE INDEX idx_documents_tenant_id ON public.documents (tenant_id);
CREATE INDEX idx_documents_transaction_id ON public.documents (transaction_id);
CREATE INDEX idx_documents_status ON public.documents (status);

CREATE INDEX idx_checklists_tenant_id ON public.checklists (tenant_id);
CREATE INDEX idx_checklists_transaction_id ON public.checklists (transaction_id);

CREATE INDEX idx_checklist_items_tenant_id ON public.checklist_items (tenant_id);
CREATE INDEX idx_checklist_items_transaction_id ON public.checklist_items (transaction_id);

CREATE INDEX idx_checklist_templates_tenant_id ON public.checklist_templates (tenant_id);

CREATE INDEX idx_messages_tenant_id ON public.messages (tenant_id);
CREATE INDEX idx_messages_transaction_id ON public.messages (transaction_id);

CREATE INDEX idx_email_ingestion_tenant_id ON public.email_ingestion (tenant_id);
CREATE INDEX idx_email_ingestion_transaction_id ON public.email_ingestion (transaction_id);

CREATE INDEX idx_tasks_tenant_id ON public.tasks (tenant_id);
CREATE INDEX idx_tasks_transaction_id ON public.tasks (transaction_id);

CREATE INDEX idx_audit_log_tenant_id ON public.audit_log (tenant_id);
CREATE INDEX idx_audit_log_transaction_id ON public.audit_log (transaction_id);

CREATE INDEX idx_api_integrations_tenant_id ON public.api_integrations (tenant_id);

-- ---------------------------------------------------------------------------
-- Functions: JWT tenant + transaction email
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_tenant_id ()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF((auth.jwt () -> 'app_metadata' ->> 'tenant_id'), '')::uuid,
    NULLIF((auth.jwt () -> 'user_metadata' ->> 'tenant_id'), '')::uuid
  );
$$;

COMMENT ON FUNCTION public.get_user_tenant_id IS
  'Returns tenant_id from JWT app_metadata or user_metadata (set via Supabase Auth hooks).';

CREATE OR REPLACE FUNCTION public.generate_transaction_email (p_transaction_id uuid)
  RETURNS text
  LANGUAGE plpgsql
  STABLE
  SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_short text;
BEGIN
  SELECT t.slug INTO v_slug
  FROM public.transactions tr
  JOIN public.tenants t ON t.id = tr.tenant_id
  WHERE tr.id = p_transaction_id;

  IF v_slug IS NULL THEN
    RETURN NULL;
  END IF;

  v_short := REPLACE(SUBSTRING(p_transaction_id::text FROM 1 FOR 8), '-', '');
  RETURN LOWER(v_slug || '-' || v_short || '@transactions.nexa.app');
END;
$$;
