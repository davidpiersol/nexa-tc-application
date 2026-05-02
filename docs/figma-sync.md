# Figma Make ↔ app sync

This repo’s **Next.js App Router** layout is the integration surface. **Figma Make** outputs a **Vite-style React tree** — you **port** screens, tokens, and copy into `app/`, `components/`, and `lib/data/`, not replace the whole app.

## Source of truth

| Layer | Where it lives |
|--------|----------------|
| **Design tokens** | `tailwind.config.ts`, `app/globals.css` |
| **Make snapshot (data + parity)** | `lib/data/figma-make.ts` |
| **Repeatable import path** | Same file + MCP fetch (below) |

When Make changes, **update tokens first** (if variables changed), then **refresh the snapshot** or replace with API types later.

## Make file

- **Editor (Make):** [Figma Make — Untitled](https://www.figma.com/make/XrH8hl5WJDXRz969sCTfoc/Untitled)
- **Published preview (Figma Site):** [Nexa TC Application](https://model-like-95584888.figma.site) — quick visual reference before diffing source into this repo.
- **`fileKey` for MCP:** `XrH8hl5WJDXRz969sCTfoc`

## Simplest refresh loop (Cursor + Figma MCP)

1. In Make, edit and publish/save the file.
2. In Cursor, use **Figma MCP** `get_design_context` with that `fileKey` and the node you care about, **or** fetch Make source files as MCP resources, e.g.  
   `file://figma/make/source/XrH8hl5WJDXRz969sCTfoc/src/app/TCDashboard.tsx`
3. Diff against:
   - `lib/data/figma-make.ts` (arrays, labels, counts)
   - `app/(dashboard)/tc/page.tsx` / `buyer/[id]/page.tsx` (layout hooks)
   - `components/ui/*` if component APIs changed
4. Run `npm run build` and fix TypeScript / a11y issues.

You do **not** need to start from scratch on each change: keep **one** snapshot module (`figma-make.ts`) and **incrementally** align pages and components.

## Augmenting or changing things in Figma later

- **Small UI tweaks in Make:** Re-fetch the relevant component or page file → patch the matching **Next** component or page section.
- **New sections:** Add to Make, then add a section in the dashboard page and optional new fields in `figma-make.ts` until real APIs exist.
- **Tokens:** If Make defines new colors/radius, add Tailwind keys and CSS variables, then replace hardcoded classes in ported JSX.

If Make diverges heavily from production (e.g. you abandon Make for a classic Design file), keep **tokens + components** in the repo as source of truth and treat Make as **reference only**.
