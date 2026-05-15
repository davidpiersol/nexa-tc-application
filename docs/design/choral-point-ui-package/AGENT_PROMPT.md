# Prompt for the implementation agent

Polish Choral Point UI/UX and incorporate the approved graphics/design elements **after the core workflow sprints are stable**.

Use the attached `choral-point-ui-package` as the visual source of truth for the next design pass. Do not interrupt or destabilize active workflow implementation to do cosmetic work early; first preserve working behavior, then apply the visual system.

## What to implement
1. Translate the shared visual system from the package into the existing app stack:
   - colors from `design-tokens.json`
   - typography guidance from `HANDOFF.md`
   - shared components and surfaces from `styles.css`
   - `assets/starburst.svg` and `assets/wave.svg`

2. Apply the approved design direction in three contexts:
   - **Public / non-application pages**: follow `help.html`
   - **Landing page**: follow `index.html`
   - **Interior application pages**: follow `app.html`

3. Preserve product functionality while improving visual coherence:
   - keep all core workflows intact
   - do not change information architecture unless required
   - do not overfit every screen to the dashboard example
   - build reusable primitives rather than one-off CSS patches

## Visual rules
- Primary tone: warm, refined, calm, premium
- Base colors: cream / porcelain surfaces with deep navy structure
- Accent: gold, used sparingly
- Signature motif: luminous wave field + starburst mark
- Corners: softly rounded
- Density: spacious but not wasteful
- Typography: Satoshi if available, otherwise use the fallback stack in the package

## Suggested sequence
1. Add theme tokens and shared primitives.
2. Restyle the landing page.
3. Restyle one public informational page.
4. Restyle one representative interior workflow page.
5. Review with the project owner.
6. Roll the system through the rest of the app once approved.

## Acceptance criteria
- Landing, public, and interior surfaces clearly feel like one product family.
- The app reflects the approved board without sacrificing usability.
- Shared components are reusable and documented.
- The result does not look like a generic SaaS template.
- Core workflows remain stable after the visual pass.

## Deliverables expected back
- implementation summary
- list of files/components changed
- screenshots of the updated landing, public, and interior pages
- any deviations from the handoff package and why
- note on whether Satoshi was used or substituted
