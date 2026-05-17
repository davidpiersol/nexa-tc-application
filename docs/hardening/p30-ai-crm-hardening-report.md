# P30 AI/CRM Hardening Report

Date: 2026-05-14
Version: v4.30.0-dev
Scope: P28 AI provider scaffolding and P29 CRM scaffolding.

## Result

P30 is a no-new-feature hardening pass. The review found the P28/P29 work intentionally scaffolded and bounded by human review. As of the later `v4.30.1-dev` testing patch, AI feature defaults may be active for local/admin testing, but no AI model calls, CRM sync calls, outbound messages, signature sends, or calendar/email sends are enabled without credentials and future server-side adapters.

## Security And Privacy

- AI credentials are represented as provider keys that reuse the encrypted `api_integrations.credentials_json` pattern. No provider secret is exposed in client components.
- The global AI page displays provider labels and credential-provider identifiers only, not secret values.
- AI usage events are tenant-scoped and contain token/cost metadata plus optional transaction/template context. They do not store prompt text by default.
- CRM external links store provider external IDs and disabled sync state only. No external CRM credential table was added.
- DeltaNET remains investigation-only until official API, partner, or export/import access is confirmed.
- Lofty, Follow Up Boss, and MoxiWorks are candidates only; sync requires future credentials, consent, and field mapping approval.

## RLS And Data API

- New P28/P29 tables enable RLS in their creation migrations.
- New public tables include explicit grants for Supabase Data API compatibility.
- AI feature settings are writable only by global admin or tenant admin for scoped tenant settings.
- AI usage events are insertable by authenticated tenant users and readable by global admin, tenant admin, and TC roles.
- CRM touchpoints and external links are tenant-scoped. CRM external links are writable by admin/TC only.

## Performance

- P28/P29 pages render from static catalog data and do not perform repeated provider fetches.
- No model requests, CRM sync loops, background jobs, polling, or long-running request-path work were introduced.
- Database indexes were added for expected tenant/feature/contact lookup paths.

## Cleanup Performed

- Renamed the CRM helper from an ambiguous sync-enabled name to `crmProviderCanBeEnabledWhenApproved`, keeping all adapter operations disabled by default.

## Deferred Risks And Recommendations

- Before enabling live AI beyond local/admin testing, add request execution through a server-only adapter layer that logs usage events before returning suggestions.
- Before storing prompt text, define a PII retention policy and redaction rules.
- Before enabling external CRM sync, require tenant/broker consent, external ID matching rules, duplicate handling, field mapping approval, and retry/error-state design.
- Before applying migrations remotely, run Supabase migration validation against a disposable database because the new AI/CRM tables depend on existing helper functions and enum roles.
- Before a stable rollback tag, David should review the global AI page, TC CRM page, and the disabled-by-default safety boundaries.
