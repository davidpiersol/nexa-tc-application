## Global Admin: Template Mapping and Canonical Field Picker

Global Admins can configure template versions in **`/admin/global/templates`** so PDF fill fields map to approved Choral Point data keys.

### Workflow

1. Select a template and upload a version PDF.
2. Open that version and review detected fillable PDF field names.
3. Use the canonical field picker to map each PDF field to:
   - transaction fields (`property_address`, `mls_number`, `close_date`, `notes`), or
   - approved `intake_data.*` keys.
4. Save mappings.
5. Approve mappings.
6. Set the version current (or use **Approve + make current**).

### Guardrails

1. A version cannot become current until mapping review is approved.
2. Only one current version is active per template.
3. Mapping changes are version-scoped and apply prospectively.
4. Picker options are constrained to canonical keys to avoid raw JSON guessing.

### Operational notes

1. If no fillable fields are detected, recheck whether the PDF is an AcroForm fillable file.
2. Saving mappings resets review to `needs_review` until re-approved.
3. Use stable naming in source PDFs to reduce remapping when uploading a new version.
