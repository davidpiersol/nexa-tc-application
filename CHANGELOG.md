# Changelog

All notable changes to this repository are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Version numbers follow **`v.X.Y.Z`** in [`VERSION`](VERSION) and [`.cursor/rules/versioning.mdc`](.cursor/rules/versioning.mdc).

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
