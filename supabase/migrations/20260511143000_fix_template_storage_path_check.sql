-- P17 hardening: make the template PDF storage-path check compatible with
-- normal PostgreSQL regex escaping and keep the existing path contract.

ALTER TABLE public.global_document_template_versions
  DROP CONSTRAINT IF EXISTS global_document_template_versions_pdf_path_check;

ALTER TABLE public.global_document_template_versions
  ADD CONSTRAINT global_document_template_versions_pdf_path_check
    CHECK (
      storage_path ~ '^templates/global/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[^/]+[.]pdf$'
    );
