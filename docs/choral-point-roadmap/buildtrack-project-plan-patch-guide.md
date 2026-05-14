# BuildTrack Project Plan Patch Guide

Target repo:

```text
/Users/e25347/Development/repos/nexa-tc-application
```

Target file:

```text
.progress/project-plan.json
```

## Current State Observed

The project currently appears in BuildTrack as:

```json
{
  "project": {
    "id": "nexa-tc-application",
    "name": "Nexa TC Application"
  },
  "syncPolicy": {
    "mode": "dashboard_only"
  },
  "versioning": {
    "currentVersion": "v4.4.2",
    "targetVersion": "v5.0.0"
  }
}
```

Existing prompt sprints include:

- `P1` BuildTrack retrofit and local-only gate
- `P2` External integration client layer
- `P3` Webhook and audit paths
- `P4` Graphics cleanup milestone

## Recommended Patch

Do not delete existing sprint history. In Cursor, update `.progress/project-plan.json` as follows:

1. Change project display name:

```json
"name": "Choral Point"
```

2. Update delivery phase:

```json
"phase": "Choral Point PDF template mapping and autofill"
```

3. Keep sync policy as dashboard-only:

```json
"mode": "dashboard_only"
```

4. Append the sprint objects from:

```text
buildtrack-cursor-port/choral-point-full-roadmap-prompt-sprints.json
```

to the existing `promptSprints[]` array.

5. Add or merge these blockers into `blockers[]`:

```json
[
  {
    "id": "B2",
    "title": "Required transaction fields not identified yet",
    "owner": "Client / TC",
    "eta": "TBD",
    "status": "open"
  },
  {
    "id": "B3",
    "title": "Default document set not identified yet",
    "owner": "Client / TC",
    "eta": "TBD",
    "status": "open"
  },
  {
    "id": "B4",
    "title": "Scorecard details not provided yet",
    "owner": "Client / TC",
    "eta": "TBD",
    "status": "open"
  },
  {
    "id": "B5",
    "title": "Title and mortgage package requirements not provided yet",
    "owner": "Client / TC",
    "eta": "TBD",
    "status": "open"
  },
  {
    "id": "B6",
    "title": "173 NMAR forms still need licensed copies",
    "owner": "Client / licensed NMAR source",
    "eta": "TBD",
    "status": "open"
  },
  {
    "id": "B7",
    "title": "Statewide New Mexico property-data provider and county-source rules not finalized",
    "owner": "David / Client / vendor research",
    "eta": "TBD",
    "status": "open"
  }
]
```

## Versioning Recommendation

Use these MSP scopes:

- `P5`: `v4.5.0-dev` - cursor orientation and Choral Point roadmap handoff
- `P6`: `v4.6.0-dev` - oAuth account creation and invite-aware signup
- `P7`: `v4.7.0-dev` - tenant admin and global admin separation
- `P8`: `v4.8.0-dev` - hardening gate: auth, OAuth, MFA, and onboarding
- `P9`: `v4.9.0-dev` - tC transaction detail and intake cleanup
- `P10`: `v4.10.0-dev` - pipeline close, archive, and intelligent search
- `P11`: `v4.11.0-dev` - contacts and broker profiles
- `P12`: `v4.12.0-dev` - vendor assignment and transaction contacts
- `P13`: `v4.13.0-dev` - document checklist and global template foundation
- `P14`: `v4.14.0-dev` - hardening gate: transactions, contacts, brokers, and document checklist
- `P15`: `v4.15.0-dev` - admin template upload and versioning
- `P16`: `v4.16.0-dev` - template field mapping and canonical field picker
- `P17`: `v4.17.0-dev` - pDF generation and generated document history
- `P18`: `v4.18.0-dev` - seed NMAR template candidates and licensed-copy tracking
- `P19`: `v4.19.0-dev` - hardening gate: templates, storage, PDF mapping, and generated documents
- `P20`: `v4.20.0-dev` - package rules and AI-assisted mapping
- `P21`: `v4.21.0-dev` - signing, packet export, and document sharing
- `P22`: `v4.22.0-dev` - broker dashboard and client/party visibility
- `P23`: `v4.23.0-dev` - MLS-only jobs and MLS write-access spike
- `P24`: `v4.24.0-dev` - billing, invoicing, and accounting integration path
- `P25`: `v4.25.0-dev` - broker e-sign provider setup and DocuSign status sync
- `P26`: `v4.26.0-dev` - hardening gate: signing, integrations, billing, and workflow handoffs
- `P27`: `v4.27.0-dev` - scorecard, notifications, calendar, and communication integrations
- `P28`: `v4.28.0-dev` - AI insertion architecture and assistive workflows
- `P29`: `v4.29.0-dev` - CRM module and external CRM integration assessment
- `P30`: `v4.30.0-dev` - hardening gate: AI, CRM, privacy, cost, and provider adapters
- `P31`: `v4.31.0-dev` - CRM build-out: actions, follow-ups, contacts, calendar, and external CRM connections
- `P32`: `v4.32.0-dev` - UI/UX polish, graphics, and design system button-up
- `P33`: `v4.33.0-dev` - statewide New Mexico property data lookup
- `P34`: `v4.34.0-dev` - hardening gate: statewide property data, UI/UX, and final pre-release cleanup
- `P35`: `v4.35.0-dev` - release hardening and stable rollback checkpoint

Do not mark any of these sprints `done` until Cursor has implemented the code and build/test validation is complete. Do not mark them `approved` until you review the work.

Each appended sprint includes:

- `reviewChecklist`
- `testChecklist`
- `fullQaPrompt`
- `milestoneMarker`

Use these fields to keep each build small, fully testable, and safe to roll back.
