# Build progress tracker

**Read next:** [`docs/session-next.md`](../../docs/session-next.md) — handoff, permissions checklist, **NEXT STEP**.

**Last updated:** 2026-05-14  
**Guide:** [`nexa_build_guide.md`](../../nexa_build_guide.md)

Update this file whenever you **finish a step**, **move to a new step**, or need to **correct** status. The AI assistant should treat this file as the source of truth for “where we are” in the build guide.

---

## At a glance

| | |
|--|--|
| **Current position** | **Choral Point roadmap development through P31 follow-up hardening** |
| **Completed** | Current work includes CRM build-out, MLS-only job scaffolding, billing/invoicing/report scaffolding, global AI configuration, template mapping work, and post-P31 QA fixes through **`v4.31.3-dev`**. |
| **Next** | Continue the active Choral Point sprint sequence from the BuildTrack project plan, with user approval checkpoints and QA gates between milestones. |
| **After that** | Use the remaining roadmap sprints for UI polish, provider integrations, and the later calendar/CRM connection work already documented in the Choral Point roadmap. |

---

## Chapter 1 — Figma (*Design system & screen blueprints*)

| Step | Title | Status |
|------|--------|--------|
| 1 | Set up your Figma file structure | Not verified in repo — confirm in Figma |
| 2 | Build the design token page | Not verified in repo — confirm in Figma |
| 3 | Build the complete component library | Not verified in repo — confirm in Figma |
| 4 | Design all 14 application screens | Not verified in repo — confirm in Figma |

> **Note:** Work starting at **Chapter 2, Step 5** assumes Chapter 1 is complete in Figma. If any Chapter 1 step is unfinished, complete it before relying on token extraction and UI generation in Chapter 2.

---

## Chapter 2 — Cursor (*Bootstrap the project from Figma*)

| Step | Title | Status |
|------|--------|--------|
| 5 | Extract design tokens from Figma into Tailwind | **Complete** — see `tailwind.config.ts`, `app/globals.css`, [`docs/design-tokens-source.md`](../../docs/design-tokens-source.md) |
| 6 | Scaffold the Next.js 14 project | **Complete** — App Router, layouts, API routes, `lib/*`, `inngest`, deps |
| 7 | Generate all components from Figma | **Complete** — see `components/ui`, `components/graphics`, `docs/components-library.md` |
| 8 | Generate all 14 screen pages | **Complete** — see `app/(dashboard)`, `app/(auth)`; MFA at `/auth/mfa` |

### Step 5 — What “done” looks like

Per the guide: named styles map into **`tailwind.config.ts`** and **`globals.css`**. If your live Figma file differs, paste the **Figma URL** and run an MCP diff against these files.

---

### Step 6 — What “done” looks like

Per the guide: Next.js 14 App Router scaffold (TypeScript strict), folder layout as specified, **`layout.tsx`** importing **`./globals.css`**, dependencies installed; manual file creation (no `create-next-app`). **Done in repo at `v1.0.3`.**

---

## Chapter 3 — Claude Code (*Database & security*)

| Step | Title | Status |
|------|--------|--------|
| 9 | Database schema & Row Level Security | **Complete** — see [`supabase/migrations/`](../../supabase/migrations/) · tagged **`v2.0.1`** |
| 10 | Auth, MFA & security hardening | **Complete** — middleware, MFA, CSRF, headers, rate limits (API routes), invites — **`v2.1.0`** |

---

## Chapter 4 — Claude Code (*Integrations & AI*)

| Step | Title | Status |
|------|--------|--------|
| 11 | Build all external API integrations | Not started |
| 12 | Build the AI First Pass engine | Not started |
| 13 | Wire data to UI & end-to-end test | Not started |

---

## Chapter 5 — Claude Code (*Help system*)

| Step | Title | Status |
|------|--------|--------|
| 14 | Build the in-app help panel | **Complete** |
| 15 | Write all help articles — every role | **In progress** — original role coverage exists; new feature help is being added as roadmap surfaces ship |

---

## Session log (optional)

Brief notes per session (append newest at top).

| Date | Notes |
|------|--------|
| 2026-05-14 | Added help coverage for MLS entry, billing/invoices, reports, TC CRM, and agent CRM; refreshed wiki status for current Choral Point roadmap work. |
| 2026-05-02 | **QA pass:** Vitest + `verify` + smoke script + Supabase empty-env fix + CI workflow + [`docs/session-next.md`](../../docs/session-next.md) — **`v2.1.1`**. |
| 2026-05-02 | **Step 10 done:** Auth/MFA/middleware/CSRF/invites/security headers — **`v2.1.0`**. |
| 2026-05-02 | **RLS follow-up:** Agent **`transactions` INSERT** policy + **`email_ingestion.from_email`** index — migration **`20260503120000_*`** · **`v2.0.2`**. |
| 2026-05-02 | **Step 9 done:** Core schema, RLS (52 policies), `updated_at` + audit triggers, `get_user_tenant_id` / `generate_transaction_email` — **`v2.0.1`**. |
| 2026-05-02 | **Step 8 done:** Figma-aligned screens, Framer Motion + kanban + placeholders; **v1.0.5**. |
| 2026-05-02 | **Step 7 done:** Component library + graphics; **v1.0.4**. |
| 2026-05-02 | **Step 6 done:** Next.js 14 manual scaffold, packages, routes, API stubs; **v1.0.3**. |
| 2026-05-02 | **Step 5 done:** Tailwind + globals + shadcn variable mapping; **v1.0.2**. |
| 2026-05-02 | Initialized tracker at **Chapter 2, Step 5**. Added `nexa_build_guide.md`, `docs/wiki/`, `CHANGELOG.md`. |
