# Build progress tracker

**Last updated:** 2026-05-02  
**Guide:** [`nexa_build_guide.md`](../../nexa_build_guide.md)

Update this file whenever you **finish a step**, **move to a new step**, or need to **correct** status. The AI assistant should treat this file as the source of truth for “where we are” in the build guide.

---

## At a glance

| | |
|--|--|
| **Current position** | **Chapter 2 — Step 6** (Scaffold the Next.js 14 project) |
| **Completed** | **Step 5:** `tailwind.config.ts` + `app/globals.css` + PostCSS/Tailwind deps — tokens from `nexa_build_guide.md` (reconcile with Figma when a file URL is available). Ship: `v1.0.2`. |
| **Next** | Finish **Step 6** (Next.js 14 scaffold + wire `globals.css`), then **Step 7** (components from Figma). |
| **After that** | Chapter 2 — Step 8, then Chapter 3+ |

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
| 6 | Scaffold the Next.js 14 project | **In progress** — current focus |
| 7 | Generate all components from Figma | Not started |
| 8 | Generate all 14 screen pages | Not started |

### Step 5 — What “done” looks like

Per the guide: named styles map into **`tailwind.config.ts`** and **`globals.css`**. If your live Figma file differs, paste the **Figma URL** and run an MCP diff against these files.

---

### Step 6 — What “done” looks like

Per the guide: Next.js 14 App Router scaffold (TypeScript strict), folder layout as specified, **`layout.tsx`** importing **`./globals.css`**, dependencies installed; manual file creation (no `create-next-app`).

---

## Chapter 3 — Claude Code (*Database & security*)

| Step | Title | Status |
|------|--------|--------|
| 9 | Database schema & Row Level Security | Not started |
| 10 | Auth, MFA & security hardening | Not started |

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
| 14 | Build the in-app help panel | Not started |
| 15 | Write all help articles — every role | Not started |

---

## Session log (optional)

Brief notes per session (append newest at top).

| Date | Notes |
|------|--------|
| 2026-05-02 | **Step 5 done:** Tailwind + globals + shadcn variable mapping; **v1.0.2**. |
| 2026-05-02 | Initialized tracker at **Chapter 2, Step 5**. Added `nexa_build_guide.md`, `docs/wiki/`, `CHANGELOG.md`. |
