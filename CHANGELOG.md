# Changelog

All notable changes to this repository are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Version numbers follow **`v.X.Y.Z`** in [`VERSION`](VERSION) and [`.cursor/rules/versioning.mdc`](.cursor/rules/versioning.mdc).

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

[v2.0.2]: https://github.com/davidpiersol/nexa-tc-application/compare/v2.0.1...v2.0.2
[v2.0.1]: https://github.com/davidpiersol/nexa-tc-application/compare/v2.0.0...v2.0.1
[v2.0.0]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.5...v2.0.0
[v1.0.5]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.4...v1.0.5
[v1.0.4]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.3...v1.0.4
[v1.0.3]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.2...v1.0.3
[v1.0.2]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.1...v1.0.2
[v1.0.1]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.0...v1.0.1
[v1.0.0]: https://github.com/davidpiersol/nexa-tc-application/releases/tag/v1.0.0
