# Changelog

All notable changes to this repository are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Version numbers follow **`v.X.Y.Z`** in [`VERSION`](VERSION) and [`.cursor/rules/versioning.mdc`](.cursor/rules/versioning.mdc).

## [Unreleased]

### Added

- **Public marketing scaffold** — added public Platform, Solutions, Resources, Company, How It Works, and Request a Demo pages aligned with the approved landing-page visual direction.
- **Production launch planning** — appended future public-content and `choralpoint.com` launch sprints plus a starter production-launch guide.

### Changed

- **Landing and login entry points** — adopted the approved Choral Point landing/login visuals and added a public Login link plus demo-request routing.

## [v4.30.5-dev] - 2026-05-14

### Changed

- **Roadmap sprint insertion** — inserted new P31 for full CRM build-out across TC and agent workspaces, then shifted UI/UX, statewide property lookup, final hardening, and release hardening to P32-P35.
- **CRM credential blocker** — added a blocker requiring OAuth, vendor/admin-assisted setup, or CSV fallback for external CRM connections where users cannot obtain API keys.

## [v4.30.4-dev] - 2026-05-14

### Added

- **AI credential testing** — added a Global Admin “Test saved key” action that decrypts the saved provider key server-side and validates it against each supported provider’s model-list endpoint without exposing the secret.
- **Provider validation tests** — added unit coverage for successful key validation, missing keys, provider rejections, and the credential test API response shape.

## [v4.30.3-dev] - 2026-05-14

### Changed

- **AI configuration cleanup** — removed the provider catalog and provider credential status card grids from the Global Admin AI page while keeping the encrypted credential form.
- **AI provider help** — moved provider reference details into the Global Admin wiki/help article for AI provider setup.

## [v4.30.2-dev] - 2026-05-14

### Added

- **Global AI credential management** — added a global-admin dashboard credential form for AI provider keys, including masked provider status and encrypted server-side storage.
- **Global provider credential schema** — added a platform-level encrypted credential table guarded by global-admin-only RLS and Data API grants.
- **AI credential API tests** — added coverage confirming secret values are not returned and unsupported providers are rejected.

## [v4.30.1-dev] - 2026-05-14

### Added

- **xAI Grok provider** — added xAI Grok as a separate provider from Groq, including credential-provider wiring and local env placeholders for testing without committing keys.

### Changed

- **AI testing defaults** — activated scaffolded AI feature defaults for testing with per-feature providers, max-token limits, a $50/month placeholder budget, and human-review safety boundaries still intact.
- **AI database defaults** — added a follow-up migration that permits `xai_grok` in AI feature settings and seeds global testing defaults prospectively.

## [v4.30.0-dev] - 2026-05-14

### Changed

- **AI/CRM hardening gate** — reviewed P28/P29 for credential exposure, tenant/RLS boundaries, cost controls, disabled provider behavior, and performance risks without adding product features.
- **CRM adapter wording** — renamed an internal CRM helper so candidate providers are described as enableable after approval, not currently synced.

### Added

- **Hardening report** — documented P30 findings, deferred risks, and recommendations for live AI execution, prompt retention, CRM sync, and migration validation.

## [v4.29.0-dev] - 2026-05-14

### Added

- **CRM-lite scaffold** — added a TC CRM page and navigation entry defining contacts, SOI segmentation, lead temperature, touch history, follow-up tasks, notes, reminders, relationships, and import/export as the CRM-lite module boundary.
- **External CRM adapter catalog** — added disabled-by-default provider scaffolding for DeltaNET / Delta Media Group, Lofty, Follow Up Boss, and MoxiWorks, with Delta marked investigation-only until official API/export access is confirmed.
- **CRM data scaffold** — added tenant-scoped CRM touchpoint and external-link tables so future sync can track consented provider IDs and disabled sync state without duplicating contact records.

## [v4.28.0-dev] - 2026-05-14

### Added

- **Provider-neutral AI catalog** — added disabled-by-default AI provider and feature scaffolding for OpenAI, Anthropic, Google Gemini, Google Vertex AI, OpenRouter-compatible gateways, and Groq.
- **AI governance schema** — added AI feature settings and usage event tables for provider/model selection, budget controls, token/cost tracking, and tenant-scoped audit history.
- **Global AI configuration page** — added a global-admin AI configuration surface showing provider credentials, per-feature defaults, max-token limits, and human-review safety boundaries.

## [v4.27.0-dev] - 2026-05-14

### Added

- **Operations center scaffold** — added dashboard notification scaffolding for invoice reminders, open TC tasks, scorecard blockers, and AI pass / Human pass activity labels.
- **Scorecard placeholder** — added a TC Scorecard page and navigation entry with blocked placeholder metrics until final team scorecard rules are supplied.
- **Communication integration plan** — documented Slack as optional/provider-scoped and Outlook/Google calendar as later OAuth/provider integrations that do not send externally yet.

## [v4.26.3-dev] - 2026-05-14

### Added

- **Invoice PDF download** — added an authenticated server-generated invoice PDF download alongside the browser invoice preview.

## [v4.26.2-dev] - 2026-05-13

### Added

- **Billing workspace navigation** — added Billing, Invoices, and Reports buttons with active-page highlighting at the top of billing/report pages.
- **Invoice print and email detail** — reformatted printable invoices using the provided sample invoice structure and expanded invoice email bodies with line items, totals, balance, and printable invoice links.
- **Clickable MLS and contact records** — made contact rows open their detail pages and added MLS-only job detail pages from the MLS entry list.
- **Invoice detail actions** — added invoice-specific Print and Email buttons to the invoice detail page while preserving Billing tab highlighting.
- **Invoice editing** — added an invoice edit screen and API update path for bill-to, status, dates, line item, tax, and notes.

### Changed

- **Billing tax summaries** — monthly, quarterly, and yearly billing cards now show tax billed separately from tax on received money.
- **Billing landing page** — removed duplicate invoice/report cards now covered by the top Billing, Invoices, and Reports navigation.
- **Invoice tax default** — changed the fallback NM GRT invoice rate from the state base rate to Los Lunas at 8.425%, while preserving the TC settings override.
- **Invoice create flow** — creating an invoice now routes directly to the new invoice detail page.

## [v4.26.1-dev] - 2026-05-13

### Added

- **Supabase Data API grants** — added an explicit grant migration for Choral Point public tables and policy helper functions ahead of Supabase's May/October 2026 Data API default-grant changes.
- **Supabase migration guidance** — documented the required grant/RLS/policy pattern for future public tables and confirmed Choral Point should avoid broad anonymous table access.

## [v4.26.0] - 2026-05-13

### Changed

- **P26 hardening gate** — reviewed signing/export, integrations, billing, and workflow handoffs for security, performance, code quality, permissions, and regression risk without adding new product features.
- **Envelope status sync performance** — de-duplicated DocuSign envelope status refreshes so documents sharing one envelope use one provider status call and one grouped database update.
- **Signing provider safety** — added typed provider-slug checking for provider labels and hardened external provider links with safe new-tab attributes.

## [v4.25.0-dev] - 2026-05-13

### Added

- **Provider-agnostic e-sign setup** — added friendly broker signing provider scaffolding for DocuSign, Adobe Acrobat Sign, SkySlope DigiSign, Dotloop, Lone Wolf Authentisign, SkySlope, and manual export fallback.
- **DocuSign status sync** — added a read-only envelope status refresh path for transaction documents with recipient delivery/signing details.
- **Provider-neutral signing metadata** — added document columns for provider slug, envelope id, envelope status, provider URL, delivery detail, and sync errors.

### Changed

- **Broker signing setup UX** — replaced raw signing preference JSON in normal broker-facing flows with provider and signing-method dropdowns.

## [v4.24.2-dev] - 2026-05-13

### Added

- **Invoice workspace split** — moved invoice search, sort, detail, print, and email operations to `/tc/billing/invoices`.
- **Universal TC reports hub** — added `/tc/reports` as the landing page for billing, contacts, brokers, transactions/listings, document operations, and future page-specific reporting.
- **Billing report detail** — added `/tc/reports/billing` with total billed, total received, taxes on received, period summaries, and invoice detail rows.

### Changed

- **Billing landing page** — kept invoice creation and high-level billed/received/tax summary cards on `/tc/billing`, with tax settings moved to the bottom.

## [v4.24.1-dev] - 2026-05-13

### Added

- **Billing usability patch** — invoice broker/client entry now searches tenant contacts and broker-client records while still allowing manual names.
- **Invoice tax defaults** — TC settings now include a default NM invoice tax rate, and invoice creation auto-calculates/stores tax using that rate.
- **Receivable follow-ups** — invoices default to payable upon receipt with 0/30/60/90 reminder scaffolding, plus a TC dashboard modal for past-due/open follow-ups.
- **Invoice operations scaffold** — invoices can be opened from the list, selected in bulk for print, and staged for email via a mailto handoff until provider email/API sync is approved.
- **Reporting scaffold** — billing now shows NM quarterly, federal quarterly, and year-end summary cards for accounting review without automated filing.

## [v4.24.0-dev] - 2026-05-13

### Added

- **Billing workspace** — added `/tc/billing` with invoice creation, invoice list, accounts receivable status, and monthly/quarterly/yearly summary cards.
- **Invoice scaffolding schema** — added billing service types, invoices, invoice line items, RLS policies, and default tenant service rows for full TC transaction, MLS-only entry, and custom services.
- **Billing API and reusable math** — added guarded invoice create/list API, centralized invoice total/currency/receivable helpers, and audit logging for invoice creation.
- **Accounting integration plan** — documented QuickBooks, Profit Power, and payment-provider integration paths while leaving external sync, payments, and tax filing out of P24 scope.
- **P24 validation coverage** — added unit tests for invoice totals/status/periods and browser smoke coverage that creates an invoice with accounting sync still not configured.

## [v4.23.0-dev] - 2026-05-13

### Added

- **MLS-only job workspace** — added `/tc/mls-entry`, `/tc/mls-entry/new`, and `/tc/mls-entry/research` so MLS entry-only service requests live outside the full TC transaction pipeline.
- **MLS entry job persistence** — added `mls_entry_jobs` schema, RLS, API create/list routes, normalizers, and billing status fields for manual MLS-only work tracking.
- **MLS write-access spike notes** — documented SWMLS/GAAR/FlexMLS write-access questions and kept MLS submission manual until write capability is confirmed.
- **P23 validation coverage** — added unit tests for MLS job helpers/nav and browser smoke coverage that creates an MLS-only job.

### Fixed

- **Local dev rendering** — Added `npm run dev:fresh` (`scripts/dev-fresh.sh`) to free port **3000**, remove `.next`, and start a single `next dev` on that port so you do not get one stale process on 3000 (unstyled pages) and a second Next on 3001. **`NEXA_WEBPACK_DEV_MEMORY_CACHE=true`** opt-in webpack **memory** cache when `.next/cache/webpack` restores fail (`PackFileCacheStrategy` / `hasStartTime`); otherwise dev uses Next’s filesystem cache for faster incremental builds.

### Changed

- **`PageEnter` reduced-motion guard** — only bypasses Framer Motion when `useReducedMotion() === true` (not on `null` unknown), avoiding inconsistent trees across SSR and hydration.

- **Dev-only login diagnostics** — `POST /api/auth/login` returns a clearer `401` body when Auth cannot connect to **`NEXT_PUBLIC_SUPABASE_URL`** (typical **`ECONNREFUSED`** against `127.0.0.1:54321` when Docker/Supabase stack is stopped). `.env.example` notes local URL vs **`npx supabase start`** requirement.

## [v4.17.1] - 2026-05-11

### Added

- **`isExpectedGlobalTemplateVersionPath`** — validates persisted global template blob paths against template/version IDs before service-role downloads.
- **PDF generation bounds** — `lib/documents/pdf-generation-limits.ts` caps source template bytes (default 15 MiB, optional `NEXA_MAX_GENERATION_TEMPLATE_MB`).
- **B11 blocker** — documents deferred items: optional output-PDF caps and PATCH semantics for immutable generated rows.

### Changed

- **Generate PDF route hardening** — rejects mismatched/invalid `storage_path`, returns `413 template_pdf_too_large` when over cap, removes orphaned uploads if document insert fails.
- **AcroForm dropdown fills** — no longer selects an arbitrary first option when values do not match; avoids silent wrong legal payloads.

## [v4.17.0] - 2026-05-11

### Added

- **Generated PDF workflow** — added transaction-scoped PDF generation from approved mapped template versions, with generated files stored under `{tenant_id}/{transaction_id}/generated/{timestamp}_{form_number}.pdf`.
- **Generated document history metadata** — added document metadata for template version lineage and source data snapshots so later template updates do not mutate existing generated PDFs.
- **P17 validation coverage** — added unit coverage for transaction data snapshots, AcroForm filling, and generated-document API insertion behavior, plus browser smoke coverage for generating a filled PDF from seeded mapped templates.

### Changed

- **Documents UI generation action** — transaction document selections now expose a guarded “Generate filled PDF” action with actionable missing-data errors and document list refresh after generation.
- **Template seed readiness** — UAT template seeds now include fillable fields and mappings for generation smoke while preserving unmapped-template behavior for validation paths.
- **Storage-path hardening** — added a follow-up migration to keep the global template storage-path check compatible with normal PostgreSQL regex behavior.

## [v4.16.0] - 2026-05-11

### Added

- **Template field mapping canonical model** — added canonical field picker helpers and mapping validation in `lib/documents/template-field-mapping.ts` for transaction fields and approved `intake_data.*` keys.
- **Template mapping persistence schema** — added migration `20260511130000_template_field_mapping.sql` with per-version `field_mappings`, mapping review status, and reviewer metadata on `global_document_template_versions`.
- **P16 validation coverage** — added focused unit tests in `tests/unit/template-field-mapping.test.ts` and expanded admin auth coverage for mapping approval route protection.

### Changed

- **Global admin template console mapping workflow** — `/admin/global/templates` now supports per-version field mapping edit, canonical picker selection, mapping save/approve actions, and mapping-review visibility.
- **Template version lifecycle gate hardening** — version PATCH actions now enforce mapping approval before `set_current`, and mapping saves reset review/current state to prevent unreviewed promotion.
- **Global admin help/wiki coverage for P16 mapping flow** — added a dedicated `/admin/global/templates` guide (`help/articles/all/global-admin-template-mappings.md`), updated global-admin overview/wiki references, refreshed wiki index notes, and regenerated compiled help content.

## [v4.15.0] - 2026-05-11

### Added

- **Global admin templates workspace** — added `/admin/global/templates` UI and API endpoints for creating template records, uploading template versions, and version lifecycle actions (approve/set current/deactivate).
- **Template safety + fillable metadata helpers** — added safe filename/path builder (`templates/global/{template_id}/{version_id}/{safe_filename}.pdf`) and AcroForm field-name extraction for uploaded PDFs.
- **P15 validation coverage** — added focused unit tests for template storage path building, fillable field detection, and admin-only API authorization.

### Changed

- **Template version lifecycle defaults** — added migration support for template version review status (`needs_review` by default) and persisted fillable field names.
- **BuildTrack sprint progression** — marked `P15` done with build/tests passed while leaving approval pending.

## [v4.14.0] - 2026-05-11

### Changed

- **P14 hardening access controls** — tightened transaction contact assignment read access in both API and RLS so non-privileged users must be linked to the transaction, reducing cross-transaction exposure risk during contacts/vendor workflows.
- **Hardening gate tracking** — updated BuildTrack sprint metadata for `P14` to `done` with build/tests marked passed and human approval still pending.

## [v4.11.2] - 2026-05-11

### Added

- **Contact delete impact API** — added `GET /api/contacts/[id]/impact` to summarize transaction intake and party/email references before contact removal.
- **Delete impact help coverage** — added `help/articles/tc/contact-delete-impact-check.md`, wired into manifest and route matching, and regenerated compiled help content.

### Changed

- **Delete warning hardening** — contact deletion confirmation now shows impact counts and sample transaction references so admins can make informed cleanup decisions.
- **P11 data depth + scenario coverage** — expanded seed dataset to 3 contacts per category, 3 brokers, and 10 linked transactions, and added deterministic end-to-end delete integrity scenarios (contact/document delete + auth guard).

## [v4.11.1] - 2026-05-10

### Added

- **CRM company scaffolding for broker normalization** — added `companies` and `contact_company_links` with additive RLS policies in `supabase/migrations/20260511060000_company_scaffolding.sql` so broker/company modeling can evolve without breaking existing contact flows.
- **Global-admin wiki surface** — added `/admin/global/wiki` plus nav/title wiring to provide a role-indexed in-app documentation hub for operations and onboarding.
- **Contacts/brokers guide coverage** — added and indexed new help articles for contacts directory, broker profiles, and global admin wiki in `help/articles/**` and regenerated `lib/help/articles.generated.ts`.

### Changed

- **P11 contacts/brokers completion hardening** — finalized dedicated contacts and brokers list/create/detail routes with edit/delete, sorted categories, broker-only profile fields, and transaction lookup integration through updated contact queries.
- **Seed depth and repeatability** — expanded `scripts/seed.ts` to seed 5-sample CRM/company data and additional transaction fixtures while keeping deterministic IDs for repeatable reruns.
- **QA/security gate pass** — executed lint, unit tests, production build, local migration apply, linked Supabase migration push, and full Playwright smoke coverage for guest, TC, and buyer paths.

## [v4.10.0] - 2026-05-10

### Added

- **Transaction archive workflow** — added archive metadata migration (`closed_at`, `archived_at`, `archived_by`) plus archive/restore API route at `app/api/transactions/[id]/archive/route.ts` and TC archive page at `/tc/archive`.
- **Targeted archive/search helpers and tests** — added `lib/transactions/archive.ts`, `lib/transactions/search.ts`, and focused unit coverage in `tests/unit/transaction-search-and-archive.test.ts`.

### Changed

- **Transactions search coverage** — `/tc/transactions` now supports query search across address, MLS, notes, intake data, and party/broker text while keeping archived records out of default views.
- **Close-date confirmation hardening** — transaction edit flow now confirms close-date handling when moving to `closed`, and API patch logic enforces close-date + `closed_at` capture and archived read-only protection.
- **TC settings archive timing** — TC settings now include configurable `autoArchiveDays` preference stored in auth metadata.
- **P10 validation tracking** — updated BuildTrack sprint metadata to `status=done` with `build/tests=passed` and approval pending for human sign-off.
## [v4.9.1] - 2026-05-10

### Changed

- **P9 transaction workspace completion + approval tracking** — finalized TC transaction workspace navigation with persistent cross-page controls (Detail, Documents, First Pass, Edit, Assign Vendors placeholder) and updated BuildTrack status/validation for approved P9 release tracking.
- **TC document operations hardening** — added document download, revised-file replacement, and delete actions with CSRF/rate-limit/audit coverage in document APIs and detail UI.
- **Document workspace scale UX** — added card/list toggle, search, and sort controls for transaction documents to support larger document sets while preserving quick detail navigation.
- **Transaction sub-detail navigation** — added dedicated party and document detail routes with back-navigation to transaction detail and transaction list.
- **QA coverage expansion** — extended Playwright smoke to cover transaction workspace navigation, party/document detail click-through, and documents page filter/view behavior; full suite passing before release.

## [v4.4.4] - 2026-05-10

### Changed

- **BuildTrack sprint validation sync** — updated `.progress/project-plan.json` so `P5` and `P6` explicitly record `validation.build = passed` and `validation.tests = passed`.
- **UAT seed admin identities** — seeded tenant/global admin test identities in [`scripts/uat-constants.ts`](scripts/uat-constants.ts) (`t_admin@nexa.test`, `g_admin@nexa.test`) and aligned role redirect checks in [`scripts/uat.ts`](scripts/uat.ts).
- **Seed idempotency hardening** — made tenant/transaction seeding tolerant of append-only audit constraints by using upserts and tenant-scoped cleanup updates in [`scripts/seed.ts`](scripts/seed.ts), enabling repeatable local seeding without manual teardown.

## [v4.4.3] - 2026-05-10

### Added

- **OAuth social login/signup scaffolding** — added Supabase-based OAuth provider support for Google, Microsoft/Azure, Apple, Facebook, and LinkedIn OIDC via [`app/api/auth/oauth/start/route.ts`](app/api/auth/oauth/start/route.ts), [`app/auth/callback/route.ts`](app/auth/callback/route.ts), and shared provider helpers in [`lib/auth/oauth-providers.ts`](lib/auth/oauth-providers.ts).
- **Invite-aware OAuth provisioning + pending access gate** — added invite-cookie handoff and post-callback provisioning in [`lib/auth/oauth-invite-complete.ts`](lib/auth/oauth-invite-complete.ts) with pending/onboarding UX at [`app/auth/access-pending/page.tsx`](app/auth/access-pending/page.tsx) and error handling at [`app/auth/auth-code-error/page.tsx`](app/auth/auth-code-error/page.tsx).
- **Global-admin auth setup help article** — added in-app help guidance for platform auth setup in [`help/articles/all/global-admin-supabase-oauth-setup.md`](help/articles/all/global-admin-supabase-oauth-setup.md), registered in [`help/articles/manifest.json`](help/articles/manifest.json), and regenerated [`lib/help/articles.generated.ts`](lib/help/articles.generated.ts).
- **Tenant/global admin scaffold (P7 start)** — added role/permission helpers, admin dashboard pages (`/admin/global`, `/admin/tenant`), global/tenant admin API scaffolding under [`app/api/admin`](app/api/admin), and migration [`20260510031500_tenant_global_admin_scaffold.sql`](supabase/migrations/20260510031500_tenant_global_admin_scaffold.sql) for seat limits, tenant access requests, tenant-admin assignments, global resource registry, and additive RLS policies.

### Changed

- **Role redirect source of truth** — [`app/api/auth/role-redirect/route.ts`](app/api/auth/role-redirect/route.ts) now resolves role from `public.users` profile lookup helpers in [`lib/auth/profile-check.ts`](lib/auth/profile-check.ts) so OAuth and password users follow the same tenant/role mapping guard.
- **Auth documentation and smoke coverage** — updated [`docs/supabase-configuration.md`](docs/supabase-configuration.md), [`.env.example`](.env.example), [`tests/unit/paths.test.ts`](tests/unit/paths.test.ts), [`tests/unit/oauth-providers.test.ts`](tests/unit/oauth-providers.test.ts), [`tests/nexa.spec.ts`](tests/nexa.spec.ts), and [`scripts/smoke-http.sh`](scripts/smoke-http.sh).

## [v4.4.2] - 2026-05-07

### Fixed

- **Hosted CSRF token mismatch** — [`app/api/csrf/route.ts`](app/api/csrf/route.ts) now forces dynamic/no-store behavior (`dynamic = "force-dynamic"`, `revalidate = 0`, explicit `Cache-Control`) so Netlify/Next do not cache token responses. This keeps cookie token and JSON token in sync for login and mutation endpoints.

## [v4.4.1] - 2026-05-07

### Fixed

- **Hosted API 404s on Netlify** — removed legacy `[[redirects]] /api/* -> /.netlify/functions/:splat` from [`netlify.toml`](netlify.toml). Next.js Runtime now serves App Router API routes directly, so `/api/csrf`, `/api/auth/login`, and related endpoints resolve correctly for hosted users.

## [v4.4.0] - 2026-05-06

### Changed

- **Sprint planning update** — added a final sprint section in [`first-pass-changes.md`](first-pass-changes.md) for client-led required/optional mapping and approval of intake field requirements.
- **Sprint phase increment** — advanced to next sprint baseline `v4.4.0` (Y bump) per project versioning cadence.

## [v4.3.2] - 2026-05-06

### Added

- **TC intake field dictionary artifact** — added [`docs/tc-intake-field-dictionary.md`](docs/tc-intake-field-dictionary.md) with deduped canonical keys grouped by provider and ordered as requested: **5, 1, 3, 2, 4**.
- **Expanded TC transaction intake form sections** — [`TransactionEditorForm`](components/tc/transaction-editor-form.tsx) now captures the sectioned intake data for TC/internal, seller, seller brokers, buyer, and buyer brokers in that same order.
- **Signature capture fields (blank at creation)** — buyer/seller signature capture tracking now uses explicit fields: `*_signature_captured` (boolean) and `*_signature_date` (date), defaulting to unchecked/blank for new transactions.
- **Transactions intake persistence** — added `transactions.intake_data` JSONB column (migration [`20260506235900_add_transactions_intake_data.sql`](supabase/migrations/20260506235900_add_transactions_intake_data.sql)), wired through `POST /api/transactions`, `PATCH /api/transactions/[id]`, and transaction detail query hydration.

## [v4.3.1] - 2026-05-06

### Added

- **TC add transaction controls** — added “Add transaction” CTA in the TC header (`dashboard-shell`) and on `/tc/transactions`, both routing to new page `/tc/transactions/new`.
- **New transaction page + form** — created `/tc/transactions/new` and reusable [`TransactionEditorForm`](components/tc/transaction-editor-form.tsx) to POST `/api/transactions` with CSRF and redirect into the created transaction detail.
- **Editable transaction detail** — `/tc/transactions/[id]` now includes an “Edit transaction” section using the same editor form to PATCH transaction fields (`status`, address, MLS, close date, notes).

### Changed

- **Dashboard title map** — `/tc/transactions/new` now resolves to “New Transaction” in [`dashboard-titles`](lib/dashboard-titles.ts).

## [v4.3.0] - 2026-05-06

### Added

- **TC settings + preferences (Sprint 3 start)** — `/tc/settings` now loads real user-scoped settings and renders a save form for profile fields (`full_name`, `phone`) plus workspace preferences (`emailNotifications`, `timezone`, `dateFormat`) stored in auth `user_metadata.preferences`.
- **Settings action + query layer** — added [`app/actions/tc-settings.ts`](app/actions/tc-settings.ts), [`lib/queries/tc-settings.ts`](lib/queries/tc-settings.ts), and shared option constants in [`lib/tc-settings-options.ts`](lib/tc-settings-options.ts).

## [v4.2.4] - 2026-05-06

### Added

- **`verify:with-clean-dev` workflow script** — [`scripts/verify-with-clean-dev.sh`](scripts/verify-with-clean-dev.sh) and `package.json` script `verify:with-clean-dev` now stop any listener on `:3000`, clear `.next`, run full `npm run verify`, then start `npm run dev:clean` for immediate manual review. Includes `--verify-only` mode for CI/local non-interactive checks.

## [v4.2.3] - 2026-05-06

### Fixed

- **Deadline click runtime crash** — [`useTransactionRealtimeRefresh`](hooks/use-transaction-realtime-refresh.ts) now guards Supabase realtime setup with `try/catch`; if websocket initialization fails (for example: `WebSocket not available: The operation is insecure`), transaction pages continue rendering and remain fully usable without live auto-refresh.

### Added

- **Cache-safe local dev command** — `package.json` adds `dev:clean` (`rm -rf .next && next dev`) to recover quickly from Next.js cache/chunk corruption that can cause blank pages.

## [v4.2.2] - 2026-05-06

### Fixed

- **Dashboard main area blank** — [`dashboard-shell`](components/dashboard/dashboard-shell.tsx): added `min-h-0` on the content column and `min-h-0 overflow-y-auto` on `<main>` so nested flex layout cannot clip page body (Overview / Transactions / Settings looked empty while the header stayed visible).
- **Authenticated dashboard rendering** — [`app/(dashboard)/layout.tsx`](app/(dashboard)/layout.tsx): `export const dynamic = "force-dynamic"` so TC routes always render on request with a live session (avoids stale or empty RSC shells for cookie-backed pages).

## [v4.2.1] - 2026-05-06

### Fixed

- **Login blank shell** — [`app/(auth)/login/page.tsx`](app/(auth)/login/page.tsx) passes `?redirect=` from the server into [`LoginForm`](app/(auth)/login/login-form.tsx) so the client no longer uses `useSearchParams` (avoids Suspense / hydration edge cases). [`app/(auth)/layout.tsx`](app/(auth)/layout.tsx) sets explicit `text-neutral-900` on the auth canvas and card.

### Added

- **Agent empty state** — [`app/(dashboard)/agent/[id]/page.tsx`](app/(dashboard)/agent/[id]/page.tsx): when there are no RLS-visible transactions, show a centered empty message instead of an empty table.

## [v4.2.0] - 2026-05-06

### Added

- **TC dashboard navigation (Sprint 2)** — KPI tiles link to filtered transaction lists (`?filter=active|due-week|pending-reviews|signatures`); deadline rows and task rows link to `/tc/transactions/[id]`; [`StatsCard`](components/ui/stats-card.tsx) supports optional `href`.
- **All transactions** — [`app/(dashboard)/tc/transactions/page.tsx`](app/(dashboard)/tc/transactions/page.tsx) loads real tenant rows via [`getTcTransactionsList`](lib/queries/tc-transactions-list.ts) (replacing placeholder IDs that caused **Open → 404**).
- **Agent overview** — [`app/(dashboard)/agent/[id]/page.tsx`](app/(dashboard)/agent/[id]/page.tsx) lists RLS-scoped transactions with links into the TC transaction workspace.
- **Pure helpers** — [`lib/tc-transaction-list-filter.ts`](lib/tc-transaction-list-filter.ts) + unit tests in [`tests/unit/tc-transaction-list-filter.test.ts`](tests/unit/tc-transaction-list-filter.test.ts).

## [v4.1.4] - 2026-05-06

### Fixed

- **Account menu clicks** — [`dashboard-shell`](components/dashboard/dashboard-shell.tsx): header and `<main>` both used `z-[1]`, so `<main>` painted above the dropdown overhang and intercepted clicks. Raised header stacking (`z-30`) and set main to `z-0`.

## [v4.1.3] - 2026-05-06

### Added

- **Account menu & auth** — `POST /api/auth/logout`, header **`AccountMenu`** on all dashboard roles, **`ProfileBody`** + profile routes (`/tc/profile`, `/{role}/{id}/profile`), **`profileHrefFromPathname`** in [`lib/dashboard-nav.ts`](lib/dashboard-nav.ts).

### Fixed

- **Buyer profile** — buyers now get Profile + Log out like other party roles ([`/buyer/[id]/profile`](app/(dashboard)/buyer/[id]/profile/page.tsx)).
- **Login field visibility** — WebKit autofill / readable ink in [`app/globals.css`](app/globals.css); reverted experimental **`scheme-light`** on auth layout and **`Input`** sizing tweaks that affected layout.
- **Dev blank screen** — corrupt `.next` cache: clear `.next` and restart `npm run dev` when `_next/static` chunks 404.

### Changed

- **[`.cursor/rules/versioning.mdc`](.cursor/rules/versioning.mdc)** — documents bug-fix **Z** cadence and sprint-certification **Y** bump (see **Sprint / bug-fix cadence**).

## [v4.0.0] - 2026-05-06

### Added

- **[`docs/production-deploy.md`](docs/production-deploy.md)** — production vs local env vars (Netlify vs `.env.local`), minimum Supabase keys for hosted deploy, demo seeding cautions, CI secrets pointer, pre-flight checklist.
- **Supabase local stack** — [`supabase/config.toml`](supabase/config.toml), [`supabase/.gitignore`](supabase/.gitignore), [`supabase/seed.sql`](supabase/seed.sql) for `supabase db reset` / CLI workflows.

### Fixed

- **Audit trigger** — migration [`20260506200000_fix_audit_row_change_no_cross_table_fields.sql`](supabase/migrations/20260506200000_fix_audit_row_change_no_cross_table_fields.sql) fixes `audit_row_change()` so inserts on `tenants` (and other tables without `transaction_id`) no longer error (`record "new" has no field "transaction_id"`).

### Changed

- **[`README.md`](README.md)** — current version badge and link to production deploy doc.
- **[`docs/deployment-online-testing.md`](docs/deployment-online-testing.md)** — cross-link to [`production-deploy.md`](docs/production-deploy.md).

## [v3.0.0] - 2026-05-03

### Added

- **NEXA brand surfaces:** [`NexaLogo`](components/brand/NexaLogo.tsx) / [`NexaIcon`](components/brand/NexaIcon.tsx) inline SVGs; [`dashboard-shell`](components/dashboard/dashboard-shell.tsx) header + collapsible sidebar rail; login + landing copy aligned with [`lib/brand/tokens.ts`](lib/brand/tokens.ts).
- **Tailwind:** `theme.extend.colors.nexa.*` in [`tailwind.config.ts`](tailwind.config.ts) (alongside existing `brand`, `neutral`, shadcn semantic colors).

### Changed

- [`app/layout.tsx`](app/layout.tsx) metadata; [`TopBar`](components/ui/top-bar.tsx) optional `leading`; [`Sidebar`](components/ui/sidebar.tsx) default brand mark + optional `collapsed`.

### Notes

- **Graphics detour:** This milestone ships a first-pass NEXA UI pass **before** Chapter 4 · Step 11. Plan a **follow-up pass** to align lockups, colors, and layout with **final client-approved** brand guidance—do not treat this as the final signed-off graphic system.

## [v2.1.1] - 2026-05-02

### Added

- **Vitest** + [`vitest.config.ts`](vitest.config.ts) — unit tests under [`tests/unit/`](tests/unit/) (`paths`, `mfa`, `csrf-constants`, `supabase/env`).
- **npm scripts:** `typecheck`, `test`, `test:watch`, **`verify`** (lint + typecheck + test + build), **`smoke`** ([`scripts/smoke-http.sh`](scripts/smoke-http.sh)).
- **[`.github/workflows/ci.yml`](.github/workflows/ci.yml)** — GitHub Actions **`npm ci`** + **`npm run verify`** on push/PR to `main`.
- **[`docs/session-next.md`](docs/session-next.md)** — handoff placemarker, permissions checklist, explicit **NEXT STEP (Step 11)**.

### Fixed

- **Supabase env fallbacks:** [`lib/supabase/env.ts`](lib/supabase/env.ts) — empty-string **`NEXT_PUBLIC_SUPABASE_*`** in `.env.local` no longer breaks middleware (was causing **500** when `??` did not apply).

## [v2.1.0] - 2026-05-02

### Added

- **Root [`middleware.ts`](middleware.ts)** — Supabase session refresh ([`lib/supabase/middleware.ts`](lib/supabase/middleware.ts)), injects **`x-nexa-user-id`**, **`x-nexa-tenant-id`**, **`x-nexa-role`** from JWT metadata; protects dashboard prefixes; **MFA gate** for **tc / admin / superadmin** until **AAL2** (`currentLevel === aal2`), with **`401`** JSON for blocked API calls.
- **Auth UI:** [`login-form.tsx`](app/(auth)/login/login-form.tsx) (`signInWithPassword` + redirect); [`auth/mfa/page.tsx`](app/(auth)/auth/mfa/page.tsx) — Supabase **TOTP** enroll + **`challengeAndVerify`** (lazy browser client to satisfy SSR build).
- **CSRF:** [`lib/security/csrf-constants.ts`](lib/security/csrf-constants.ts), [`csrf-server.ts`](lib/security/csrf-server.ts), [`GET /api/csrf`](app/api/csrf/route.ts) — httpOnly cookie + header **`x-csrf-token`**; **`POST /api/transactions`** and **`POST /api/invite/redeem`** validate tokens.
- **Rate limiting (Upstash, Node Route Handlers):** [`lib/security/enforce-rate-limit.ts`](lib/security/enforce-rate-limit.ts) — **100/min** per user id or IP on **`POST /api/transactions`** and **`POST /api/invite/redeem`**. *(Middleware stays Edge-safe: login **10/15m/IP** from spec is not applied in middleware because `@upstash/redis` targets Node; use Supabase Auth dashboard limits + optional dedicated login Route Handler later.)*
- **Security headers** in [`next.config.mjs`](next.config.mjs) — CSP, **`X-Frame-Options: DENY`**, **`nosniff`**, **`Referrer-Policy: strict-origin`**, **`Permissions-Policy`**, HSTS (production only).
- **Audit helper:** [`lib/security/audit.ts`](lib/security/audit.ts) — inserts **`audit_log`** rows with optional IP / **`user_agent`** in JSON payload.
- **Invites:** [`lib/invite/jwt.ts`](lib/invite/jwt.ts) (**jose**, 72h HS256), [`lib/invite/redis.ts`](lib/invite/redis.ts) replay prevention, [`POST /api/invite/redeem`](app/api/invite/redeem/route.ts), [`lib/email/postmark-invite.ts`](lib/email/postmark-invite.ts); invite UI [`invite/[token]`](app/(auth)/invite/[token]/page.tsx).
- **Service role:** [`lib/supabase/admin.ts`](lib/supabase/admin.ts) for redeem path only (server-only).
- **DB:** [`20260503140000_user_role_superadmin.sql`](supabase/migrations/20260503140000_user_role_superadmin.sql) — **`superadmin`** enum label for MFA/RBAC text.

### Changed

- **`docs/wiki/progress.md`** — Step **10** complete; current step **11**.

## [v2.0.2] - 2026-05-02

### Added

- **Migration [`20260503120000_agent_tx_insert_email_index.sql`](supabase/migrations/20260503120000_agent_tx_insert_email_index.sql):**
  - **`transactions_insert_agent`** — `authenticated` users with role **`agent`** may **INSERT** rows in **`transactions`** for their tenant (matches build guide “Agents: … INSERT … linked transactions” alongside existing TC/admin insert policy). Any tenant agent can open a transaction row; tighten later if only certain agents should.
  - **`idx_email_ingestion_from_email`** — B-tree on **`email_ingestion.from_email`** for inbound lookup and routing.

## [v2.0.1] - 2026-05-02

### Added

- **Chapter 3 · Step 9 — Supabase migrations** ([`supabase/migrations/`](supabase/migrations/)):
  - **`20260502120000_initial_schema.sql`** — enums (`user_role`, `transaction_status`, `document_status`, `document_category`, `party_role`), tables (`tenants`, `users`, `transactions`, `transaction_parties`, `documents`, `checklists`, `checklist_items`, `checklist_templates`, `messages`, `email_ingestion`, `tasks`, `audit_log`, `api_integrations`), indexes (`tenant_id`, child `transaction_id`, `status`, `users.email`, `transactions.close_date DESC`), **`get_user_tenant_id()`**, **`generate_transaction_email(uuid)`**.
  - **`20260502120001_row_level_security.sql`** — session helpers (`session_tenant_id`, `session_role`, party predicates), **RLS on all tables** with role-scoped CRUD per build guide (tenant isolation, TC/admin vs parties vs **`audit_log`** insert-only / no select).
  - **`20260502120002_triggers.sql`** — **`set_updated_at`** on mutable tables, **`audit_row_change`** after INSERT/UPDATE/DELETE on business tables, append-only enforcement on **`audit_log`**.

### Changed

- **`docs/wiki/progress.md`** — Step 9 marked complete; current step **Step 10**.

## [v2.0.0] - 2026-05-02

### Added

- **Figma Make integration (milestone):** snapshot module [`lib/data/figma-make.ts`](lib/data/figma-make.ts) sourced from Make file key **`XrH8hl5WJDXRz969sCTfoc`** — TC pipeline, KPIs, deadlines, tasks; buyer timeline, dates, documents.
- **[`docs/figma-sync.md`](docs/figma-sync.md)** — how to refresh from Make via MCP, token ownership, and future edits without restarting the app.
- **`ProgressTimeline`** ([`components/ui/progress-timeline.tsx`](components/ui/progress-timeline.tsx)) — responsive horizontal/vertical timeline (SSR-safe; no `window`).
- **`TransactionCard`** optional **`subtitle`** (e.g. city/state from Make).

### Changed

- **`/tc`:** Uses Make-aligned stats, kanban data (column order matches Make: pre-listing → … → closed), deadlines and tasks rows.
- **`/buyer/[id]`:** Buyer dashboard sections aligned with Make — progress timeline, important dates, document grid with **`DocumentIcons`** thumbnails.
- **`TcPipelineKanban`:** Column order matches Figma Make **`TCDashboard`**.

## [v1.0.5] - 2026-05-02

### Added

- **Screens** mapped from build guide / Figma names: TC Dashboard (kanban, stats, deadlines, tasks), transaction detail, first-pass, documents, agent/buyer/seller/mortgage/title dashboards, login, **MFA at `/auth/mfa`**, invite.
- **Motion:** `PageEnter` (200ms fade + slide) via `app/(dashboard)/template.tsx` and `app/(auth)/template.tsx`; **`StatCountUp`** for KPI numbers; checklist completion animation (gold flash + strikethrough) in **`ChecklistPanel`** when `animateComplete`.
- **Kanban:** `TcPipelineKanban` with **@dnd-kit** + **`DragOverlay`** scale lift; **`dashboard-shell`** uses **`PatternBg`** + **`dashboardTitleForPath`**.
- **`lib/data/screen-placeholders.ts`** — centralized placeholder data + TODO hooks.
- **`lib/dashboard-titles.ts`** — frame-aligned titles in top bar.
- **Redirect:** `/mfa` → `/auth/mfa`.

### Changed

- Removed legacy **`/mfa`** page in favor of **`/auth/mfa`**.

### Note

Frames were implemented from **`nexa_build_guide.md`** + design tokens (no Figma MCP URL in repo). Paste file URLs to reconcile pixel-perfect layout.

## [v1.0.4] - 2026-05-02

### Added

- **UI components** (`components/ui/`): Button, Input, Badge, Avatar, DocumentCard, StatsCard, TransactionCard, Sidebar, TopBar, DataTable, Modal, MessageThread, ChecklistPanel, FirstPassReview, TimelineBar — **cva** variants, TypeScript + JSDoc, Tailwind **brand** / **neutral** / **status** tokens, Radix primitives (slot, dialog, label, checkbox, scroll-area).
- **Graphics** (`components/graphics/`): `HeroGraphic`, `ProgressRing`, `DocumentIcons` (6 categories), `EmptyState`, `PatternBg`; barrel `index.ts`.
- **Dependencies:** `class-variance-authority`, `@radix-ui/react-slot`, `dialog`, `label`, `checkbox`, `scroll-area`.
- **`docs/components-library.md`** — inventory + Figma reconciliation note.

### Note

Component specs match **`nexa_build_guide.md`** Step 3 (Figma page **“01 — Component Library”**). Share a **Figma URL** to diff via MCP.

## [v1.0.3] - 2026-05-02

### Added

- **Next.js 14** App Router scaffold (no `create-next-app`): root `app/layout.tsx`, `next.config.mjs`, strict `tsconfig.json` with **`@/*` → `./*`**, ESLint.
- **Routes:** `(auth)` — `login`, `signup`, `mfa`, `invite/[token]`; `(dashboard)` — `tc` (+ nested transaction routes), `agent|buyer|seller|mortgage|title/[id]`, role-aware **sidebar + top bar** shell.
- **API:** `transactions`, `documents`, `checklists`, `messages`, `webhooks/docusign`, `webhooks/email`, `integrations/mls`, `integrations/bank`, **`api/inngest`** (Inngest serve).
- **Libs:** `lib/supabase` (browser + server clients), `lib/inngest`, stubs under `lib/docusign`, `anthropic`, `mls`, `email`, `security`; `lib/utils/cn.ts`; `lib/api/stub-response.ts`.
- **`inngest/functions`** — placeholder function; **`supabase/migrations`**, **`types/`**, **`help/articles/*`**, **`public/graphics`**, **`components/*`** segment folders (README placeholders).
- **Dependencies:** per build guide (Next, Supabase, Anthropic, DocuSign, Inngest, Upstash, RHF, Zod, Framer Motion, PDF, DnD, markdown, etc.).
- **`.env.example`** — all integration keys (empty); **`.env.local`** scaffold (gitignored).

### Changed

- **`tailwind.config.ts`** — flattened `borderRadius` / `boxShadow` brand keys for TypeScript compatibility (`rounded-brand-lg`, `shadow-brand-md`, …).

## [v1.0.2] - 2026-05-02

### Added

- **`tailwind.config.ts`** — Nexa `brand` / `neutral` / `status` scales, typography (`heading-*`, `ui-*`, `prose-body`), `gds-*` spacing scale, brand shadows and radii, shadcn/ui theme hooks (`primary`, `muted`, `destructive`, `chart-*`, etc.).
- **`app/globals.css`** — Google Fonts imports, `@tailwind` layers, `:root` and `.dark` HSL variables for shadcn patterns, warm neutral body background.
- **`postcss.config.mjs`**, **`package.json`** (Tailwind 3.4 + `tailwindcss-animate`), **`tsconfig.json`** for tooling.
- **`docs/design-tokens-source.md`** — Notes on reconciling with Figma MCP.

### Changed

- **`README.md`**, **`VERSION`** → `v1.0.2`.

### Note

Tokens are authored from **`nexa_build_guide.md`** Step 2 (same names as Figma page **“00 — Design Tokens”**). Share your Figma file URL to diff live styles via MCP.

## [v1.0.1] - 2026-05-02

### Added

- **`nexa_build_guide.md`** — Full Nexa build guide (exported from `nexa_build_guide.docx`, Markdown for git).
- **`docs/wiki/`** — Design/build wiki: [`docs/wiki/README.md`](docs/wiki/README.md) (index) and [`docs/wiki/progress.md`](docs/wiki/progress.md) (step tracker; **current: Chapter 2, Step 5**).
- **`CHANGELOG.md`** — This file.

### Changed

- **`README.md`** — Links to the wiki, changelog, and build guide.

## [v1.0.0] - 2026-05-02

### Added

- Initial repository: Cursor rules layout (awesome-cursorrules–style), versioning policy (`v1.0.0`), `rules-new/` templates, baseline tag `v1.0.0`.

[v3.0.0]: https://github.com/davidpiersol/nexa-tc-application/compare/v2.1.1...v3.0.0
[v2.1.1]: https://github.com/davidpiersol/nexa-tc-application/compare/v2.1.0...v2.1.1
[v2.1.0]: https://github.com/davidpiersol/nexa-tc-application/compare/v2.0.2...v2.1.0
[v2.0.2]: https://github.com/davidpiersol/nexa-tc-application/compare/v2.0.1...v2.0.2
[v2.0.1]: https://github.com/davidpiersol/nexa-tc-application/compare/v2.0.0...v2.0.1
[v2.0.0]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.5...v2.0.0
[v1.0.5]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.4...v1.0.5
[v1.0.4]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.3...v1.0.4
[v1.0.3]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.2...v1.0.3
[v1.0.2]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.1...v1.0.2
[v1.0.1]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.0...v1.0.1
[v1.0.0]: https://github.com/davidpiersol/nexa-tc-application/releases/tag/v1.0.0
