# Choral Point UI handoff

## Purpose
Use this package **after the core workflow sprints are stable** to polish the Choral Point product and align the public pages, landing experience, and interior UI with the approved visual direction.

This package is intentionally static and portable. It is not meant to replace product architecture; it is meant to give the implementation agent a faithful visual reference that can be translated into the existing stack.

## Included files
- `index.html` — landing-page reference
- `help.html` — non-application/public-page reference
- `app.html` — interior/dashboard reference
- `styles.css` — shared visual system and reusable component styling
- `design-tokens.json` — compact machine-readable token summary
- `assets/starburst.svg` — reusable brand icon
- `assets/wave.svg` — reusable wave motif
- `AGENT_PROMPT.md` — ready-to-send prompt for the implementation agent

## Approved visual direction
### 1. Public / non-application pages
Use the airy header treatment from `help.html`:
- brand lockup on the left
- sparse navigation on the right
- cream background
- restrained use of gold
- luminous wave motif inside hero sections or large feature panels

Appropriate pages:
- Help
- Wiki / documentation
- Public browsing pages
- Marketing or pre-login informational pages

### 2. Landing page
Use `index.html` as the reference for:
- large hero headline
- broad rounded hero panel
- cream-to-navy luminous wave background
- minimal CTAs
- premium, calm spacing

### 3. Interior application pages
Use `app.html` as the reference for:
- warm off-white app shell
- left navigation rail
- rounded white cards
- navy typography with gold as an accent only
- calm information density
- dashboard-style metric cards and progress modules

## Reusable design system guidance
### Keep
- Navy text hierarchy
- Cream / porcelain surfaces
- Gold only for emphasis, state, and brand warmth
- Rounded containers
- Wide spacing
- The wave motif as a signature visual element

### Avoid
- Dark mode by default
- Overusing gold
- Generic blue SaaS styling
- Dense gray enterprise tables without warm surface treatment
- Decorative clutter that competes with workflow clarity

## Typography
The approved board specifies **Satoshi**. If the product already has licensed Satoshi files, load them via `@font-face`. If not, retain the fallback order from `styles.css` until licensing or asset delivery is resolved.

## Recommended implementation order
1. Stabilize core workflows and data flows first.
2. Extract the tokens from `design-tokens.json` into the app’s theme layer.
3. Implement shared primitives:
   - brand lockup
   - buttons
   - cards
   - app shell
   - public header
   - hero surface
4. Apply the system first to:
   - landing page
   - one representative public page
   - one representative interior page
5. Once approved, propagate across the rest of the app.

## Fidelity checkpoints
Before considering the polish work complete, compare the implementation against this package for:
- palette
- typography hierarchy
- logo/starburst treatment
- public header layout
- hero composition
- interior shell/card styling
- restrained use of the wave motif
- overall warmth and calmness of the interface

## Source of truth
If implementation tradeoffs arise, use this priority order:
1. Existing product functionality and workflow correctness
2. Approved design board
3. This static package
4. Framework defaults
