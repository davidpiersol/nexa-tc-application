# Cursor Build Prompt: Choral Point Full Roadmap

Paste this into Cursor while opened in:

```text
/Users/e25347/Development/repos/nexa-tc-application
```

## Prompt

```text
You are working in the Choral Point application repository.

Use the BuildTrack Cursor rule in `.cursor/rules/buildtrack-progress.mdc`.
Use `.progress/project-plan.json` as the local source of truth.
Do not sync to Jira or Confluence; this remains `dashboard_only`.

First, update BuildTrack tracking only:
- Rename the project display name from Nexa TC Application to Choral Point.
- Append the full Choral Point roadmap prompt sprints from:
  /Users/e25347/Documents/Codex/2026-05-10/review-this-transcript-regarding-the-nexa/buildtrack-cursor-port/choral-point-full-roadmap-prompt-sprints.json
- Add blockers for:
  - Required transaction fields not identified yet
  - Default document set not identified yet
  - Signing workflow/provider decision needs plain-language clarification
  - Scorecard details not provided yet
  - Title and mortgage package requirements not provided yet
  - 173 NMAR forms still need licensed copies
  - Statewide New Mexico property-data provider and county-source rules not finalized

Then begin sprint P5 only.

Goal for P5:
Read the directions, confirm the roadmap is wired into BuildTrack, and provide the exact next implementation prompt. Do not change application behavior yet.

Implement P5 with:
- Confirm project display name is Choral Point in `.progress/project-plan.json`.
- Confirm full roadmap prompt sprints P5-P33 are present without deleting existing sprint history.
- Confirm existing dashboard-only sync mode is preserved.
- Confirm discovery blockers are present.
- Confirm roadmap docs exist in `docs/choral-point-roadmap`.
- Return the exact next prompt for P6.

Do not implement application code in P5.
Do not rename app copy, files, routes, package metadata, or UI yet unless a separate sprint specifically starts that work.

After implementation:
- Run only the checks needed to verify JSON/doc wiring unless you discover code changes.
- Update sprint P5 validation fields if appropriate.
- Mark P5 `done` only if project-plan JSON remains valid and no app behavior changed.
- Do not mark P5 `approved`.
- Append a summarized prompt history entry to `.progress/prompt-history.local.ndjson`; do not store the raw full prompt.
```

## Context Links for Cursor

Planning docs:

```text
docs/choral-point-roadmap/README.md
docs/choral-point-roadmap/full-roadmap-review-qa-ai-crm-notes.md
docs/choral-point-roadmap/ai-provider-cost-and-wiring-guide.md
docs/choral-point-roadmap/auth-oauth-account-strategy.md
docs/choral-point-roadmap/statewide-nm-property-data-strategy.md
docs/choral-point-roadmap/nmar-forms-template-inventory.md
```

NMAR inventory and downloaded PDFs:

```text
docs/choral-point-roadmap/nmar-forms-template-inventory.csv
/Users/e25347/Documents/Codex/2026-05-10/review-this-transcript-regarding-the-nexa/nmar-public-downloads
```

BuildTrack contract:

```text
/Users/e25347/Development/repos/buildtrack/docs/progress-contract.md
/Users/e25347/Development/repos/buildtrack/.cursor/rules/buildtrack-progress.mdc
```
