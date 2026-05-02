# Nexa TC Application

**Current version:** [v2.1.1](VERSION)

Application repository with Cursor AI rules structured after [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules).

## Build guide & progress

| Resource | Description |
|----------|-------------|
| [`nexa_build_guide.md`](nexa_build_guide.md) | Full Nexa build guide (Figma › Cursor › Claude Code › Production); copy-paste prompts |
| [`docs/wiki/progress.md`](docs/wiki/progress.md) | **Step tracker** — completed work, current step, next steps |
| [`docs/wiki/README.md`](docs/wiki/README.md) | Wiki index |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history |
| [`docs/figma-sync.md`](docs/figma-sync.md) | **Figma Make** ↔ repo sync (`fileKey`, MCP refresh loop) |
| [`supabase/migrations/`](supabase/migrations/) | **Step 9** — Postgres schema, RLS, triggers · **Step 10** — auth/security (`middleware`, MFA, CSRF — **`v2.1.0`**) |

**Current build position:** Chapter 4 · Step 11 — see [`docs/wiki/progress.md`](docs/wiki/progress.md).

**Design tokens:** [`tailwind.config.ts`](tailwind.config.ts), [`app/globals.css`](app/globals.css), notes in [`docs/design-tokens-source.md`](docs/design-tokens-source.md). **Make snapshot:** [`lib/data/figma-make.ts`](lib/data/figma-make.ts).

**Published Make preview:** [Nexa TC Application (Figma Site)](https://model-like-95584888.figma.site)

**UI library:** [`components/ui`](components/ui) (`cva` + Radix + Nexa tokens), [`components/graphics`](components/graphics). See [`docs/components-library.md`](docs/components-library.md).

**Scripts:** `npm run dev` · `npm run build` · `npm run start` · `npm run lint` · **`npm run verify`** (lint + typecheck + unit tests + build) · **`npm run smoke`** (HTTP smoke; run dev server first)

**Next session:** [`docs/session-next.md`](docs/session-next.md)

Copy [`.env.example`](.env.example) to `.env.local` and fill keys (`.env.local` is gitignored).

## Cursor rules layout

| Location | Purpose |
| -------- | ------- |
| [`.cursorrules`](.cursorrules) | Root-level instructions for Cursor AI (project + versioning summary) |
| [`.cursor/rules/`](.cursor/rules/) | Project rules in `.mdc` format; [`versioning.mdc`](.cursor/rules/versioning.mdc) always applies |
| [`rules-new/`](rules-new/) | Stack-oriented `.mdc` rule templates (from awesome-cursorrules `rules-new`) |
| [`rules/`](rules/) | Optional place for `.cursorrules` packs per [awesome-cursorrules conventions](https://github.com/PatrickJS/awesome-cursorrules) |

## Versioning

Releases use **v.X.Y.Z** as defined in [`.cursor/rules/versioning.mdc`](.cursor/rules/versioning.mdc) and the [`VERSION`](VERSION) file.

- **X** — Milestone version (milestones, upgrades, major evolution)
- **Y** — Phase/sprint closure after stable, tested delivery
- **Z** — Tests, minor fixes, design/layout tweaks

## Credits

Rule layout and `rules-new/` content originate from [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) (see upstream license).
