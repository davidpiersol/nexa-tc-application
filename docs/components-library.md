# Component library

Implementation follows **`nexa_build_guide.md`** Chapter 1 · Step 3 (“01 — Component Library”), not a live Figma MCP pull (paste your **Figma file URL** + node id to reconcile naming/spacing).

## UI (`components/ui`)

| File | Notes |
|------|--------|
| `button.tsx` | `cva` variants: primary, gold, secondary, ghost, danger × sizes; Radix Slot |
| `input.tsx` | Label + field + helper; focus/error states |
| `badge.tsx` | Pill variants incl. `status.*` via semantic classes |
| `avatar.tsx` | XS–XL, navy / gold initials |
| `document-card.tsx` | 240px card, uses `Button`, `Badge` |
| `stats-card.tsx` | KPI tile, gold top rule |
| `transaction-card.tsx` | Kanban card + `accentVariants` |
| `sidebar.tsx` | 256px nav, `next/link` |
| `top-bar.tsx` | 64px title bar |
| `data-table.tsx` | Generic column API |
| `modal.tsx` | Radix Dialog |
| `message-thread.tsx` | Radix ScrollArea |
| `checklist-panel.tsx` | Radix Checkbox |
| `first-pass-review.tsx` | Uses `ProgressRing` |
| `timeline-bar.tsx` | Horizontal steps |

Barrel: [`components/ui/index.ts`](../components/ui/index.ts).

## Graphics (`components/graphics`)

`HeroGraphic`, `ProgressRing`, `DocumentIcons`, `EmptyState`, `PatternBg` — SVG-based; hex values match design tokens.
