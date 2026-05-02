# Changelog

All notable changes to this repository are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Version numbers follow **`v.X.Y.Z`** in [`VERSION`](VERSION) and [`.cursor/rules/versioning.mdc`](.cursor/rules/versioning.mdc).

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

[v1.0.2]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.1...v1.0.2
[v1.0.1]: https://github.com/davidpiersol/nexa-tc-application/compare/v1.0.0...v1.0.1
[v1.0.0]: https://github.com/davidpiersol/nexa-tc-application/releases/tag/v1.0.0
