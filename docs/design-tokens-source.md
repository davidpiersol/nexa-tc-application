# Design tokens source

| Layer | Role |
| ----- | ---- |
| **`tailwind.config.ts`** | `brand.*`, `neutral.*`, `status.*`, typography scale, `gds-*` spacing, `rounded-brand-*` / `shadow-brand-*`, shadcn color keys wired to CSS variables |
| **`app/globals.css`** | Google Fonts (Playfair Display, Inter), `:root` / `.dark` HSL variables for shadcn/ui, warm body background |

Tokens match **`nexa_build_guide.md`** Chapter 1 · Step 2 (`brand/navy-deep`, `neutral/50`, etc.).

## Figma MCP reconciliation

The Cursor Figma MCP needs a **file URL** (and usually a **node id** for the tokens page or frame). Paste your Nexa file link into chat and ask to diff variable definitions against this repo; adjust hex/HSL if your published styles differ.
