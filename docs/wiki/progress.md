# Build progress tracker

**Last updated:** 2026-05-02  
**Guide:** [`nexa_build_guide.md`](../../nexa_build_guide.md)

Update this file whenever you **finish a step**, **move to a new step**, or need to **correct** status. The AI assistant should treat this file as the source of truth for “where we are” in the build guide.

---

## At a glance

| | |
|--|--|
| **Current position** | **Chapter 2 — Step 5** (Extract design tokens from Figma into Tailwind) |
| **Completed** | Repo bootstrap (`v1.0.0`); guide + wiki + changelog added (`v1.0.1`). *Chapter 1 Figma steps are not verified in this repository—confirm in Figma if needed.* |
| **Next** | Chapter 2 — Step 6 (Scaffold the Next.js 14 project) |
| **After that** | Chapter 2 — Steps 7 → 8, then Chapter 3+ |

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
| 5 | Extract design tokens from Figma into Tailwind | **In progress** — current focus |
| 6 | Scaffold the Next.js 14 project | Not started |
| 7 | Generate all components from Figma | Not started |
| 8 | Generate all 14 screen pages | Not started |

### Step 5 — What “done” looks like

Per the guide: Figma MCP reads page **“00 — Design Tokens”**; named styles are mapped into **`tailwind.config.ts`** (brand / neutral / status colors, fonts, spacing, shadows, radii, shadcn-related extensions) and **`globals.css`** (fonts, CSS variables, warm neutral base, dark mode scaffold).

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
| 2026-05-02 | Initialized tracker at **Chapter 2, Step 5**. Added `nexa_build_guide.md`, `docs/wiki/`, `CHANGELOG.md`. |
