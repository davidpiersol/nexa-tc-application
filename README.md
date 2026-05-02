# Nexa TC Application

**Current version:** [v1.0.0](VERSION)

Application repository with Cursor AI rules structured after [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules).

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
