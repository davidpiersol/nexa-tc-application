# BuildTrack / Cursor Port Package for Choral Point

This folder packages the full Choral Point roadmap from the transcript review so it can be ported into Cursor and tracked by BuildTrack.

## BuildTrack App Found

Likely app name/path:

```text
/Users/e25347/Development/repos/buildtrack
```

BuildTrack discovers repos that contain:

```text
.progress/project-plan.json
```

The Nexa/Choral Point repo already has BuildTrack tracking files:

```text
/Users/e25347/Development/repos/nexa-tc-application/.progress/project-plan.json
/Users/e25347/Development/repos/nexa-tc-application/.cursor/rules/buildtrack-progress.mdc
```

## BuildTrack Rules That Matter

- `.progress/project-plan.json` is the committed source of truth.
- Use MSP versioning: `vM.S.P[-label]`.
- Prompt sprints move through `todo -> in_progress -> done -> approved`.
- `done` means build/test work is complete.
- `approved` means human acceptance happened.
- Prompt history should be summarized, not stored as raw full prompts.
- This project is currently `dashboard_only`; Jira/Confluence sync is disabled.

## Files in This Port Package

```text
buildtrack-cursor-port/
  README.md
  buildtrack-project-plan-patch-guide.md
  choral-point-full-roadmap-prompt-sprints.json
  cursor-build-prompt.md
  full-roadmap-review-qa-ai-crm-notes.md
  ai-provider-cost-and-wiring-guide.md
  auth-oauth-account-strategy.md
  tenant-global-admin-boundaries.md
  statewide-nm-property-data-strategy.md
```

Use the patch guide first, then paste the Cursor prompt into Cursor from inside:

```text
/Users/e25347/Development/repos/nexa-tc-application
```

## Supporting Planning Artifacts

The prior transcript and NMAR planning artifacts live here:

```text
/Users/e25347/Documents/Codex/2026-05-10/review-this-transcript-regarding-the-nexa/nexa-transcript-review-sprint-plan.md
/Users/e25347/Documents/Codex/2026-05-10/review-this-transcript-regarding-the-nexa/nmar-forms-template-inventory.md
/Users/e25347/Documents/Codex/2026-05-10/review-this-transcript-regarding-the-nexa/nmar-forms-template-inventory.csv
/Users/e25347/Documents/Codex/2026-05-10/review-this-transcript-regarding-the-nexa/nmar-public-downloads
```

NMAR inventory summary:

- 194 form entries extracted.
- 21 official public PDFs downloaded.
- 173 forms still require licensed copies.

## QA, AI, and CRM Notes

Use this companion file before running the roadmap in Cursor:

```text
buildtrack-cursor-port/full-roadmap-review-qa-ai-crm-notes.md
```

It includes:

- Coverage review against the transcript
- Stable rollback rules
- Per-sprint QA expectations
- OAuth account creation strategy
- AI insertion points
- Multi-provider AI cost and wiring guidance
- CRM-lite feature recommendations
- External CRM integration candidates, including DeltaNET, Lofty, Follow Up Boss, and MoxiWorks

## Auth and OAuth Account Creation

Use this companion file before building the account-creation sprint:

```text
buildtrack-cursor-port/auth-oauth-account-strategy.md
```

It keeps social login tied to Supabase Auth, invite-aware tenant/role assignment, and MFA requirements for privileged roles.

## Tenant and Global Admin Boundaries

Use this companion file before building the tenant/global admin sprint:

```text
docs/choral-point-roadmap/tenant-global-admin-boundaries.md
```

It separates platform-level global administration from tenant-level account and invite administration.

## Statewide New Mexico Property Data

Use this companion file before building the property lookup sprint:

```text
buildtrack-cursor-port/statewide-nm-property-data-strategy.md
```

It keeps the implementation statewide, provider-first, county-aware, and safe when county data is only available through manual research or copy/paste.
