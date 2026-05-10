# Choral Point Full Roadmap Review, QA, AI, and CRM Notes

This document supplements the BuildTrack prompt sprint JSON with review coverage, stable rollback rules, AI insertion points, and CRM integration options.

## Review Coverage Against Transcript

The current full roadmap package covers the major transcript asks:

- Choral Point naming and rename scope
- OAuth account creation and invite-aware signup
- Tenant admin and global admin separation
- Required fields discovery blocker
- Default document set blocker
- TC dashboard and transaction detail changes
- Parties / Documents / Activity transaction detail layout
- Persistent transaction actions
- Legal property description near address and MLS
- Buyer broker / seller broker / both service designation
- Transaction search
- Close-date capture
- Archive controls and auto-archive settings
- Contacts and dedicated broker tab
- Broker profile and signing preferences
- Contact categories, SOI, vendors, lenders, title, attorneys
- Vendor/service-provider assignment to transactions
- Document checklist, global templates, template revisions
- PDF field mapping and autofill
- NMAR form inventory and licensed-copy tracking
- Package rules for seller, buyer, title, and broker-specific packets
- Signing/export workflow with manual fallback
- Broker dashboard and role-based visibility
- MLS-only job workflow
- Billing/invoicing/accounting integration path
- Scorecard placeholder and blocker
- Notifications, activity, Slack/Outlook/calendar integration planning
- AI client/AI workflow strategy
- CRM module and external CRM integration assessment
- UI/UX/graphics button-up sprint
- Statewide New Mexico property-data lookup
- Release hardening and stable rollback checkpoint

Known blockers still intentionally tracked:

- Required transaction fields not identified yet
- Default document set not identified yet
- Signing workflow/provider decision needs plain-language clarification
- Scorecard details not provided yet
- Title/mortgage package requirements not provided yet
- 173 NMAR forms still need licensed copies
- DeltaNET public API availability is unconfirmed
- Statewide New Mexico property-data provider and county-source rules are not finalized

## Stable Rollback and Milestone Rules

The product is currently code-stable. Treat that as the baseline before starting `P5`.

For every sprint:

- Create or note a pre-sprint git commit/branch state before Cursor begins.
- Do not combine unrelated sprints in one Cursor build.
- A sprint is **code complete** only when Cursor finishes implementation and updates BuildTrack validation.
- A sprint is **fully tested** only when:
  - Typecheck passes
  - Unit tests pass
  - Build passes
  - Focused browser smoke passes
  - Role/RLS checks pass where applicable
  - Full QA prompt for that sprint passes
- A sprint is **rollback-safe** only after human review confirms the sprint works and no blocking regression remains.
- Only then create a stable tag or branch using:

```text
stable/choral-point-v4.{sprint_number}.0
```

Example:

```text
stable/choral-point-v4.6.0
```

BuildTrack distinction:

- `status=done`: build/test passed and ready for review
- `validation.approval=pending`: not yet accepted by David
- `status=approved`: accepted as a stable checkpoint candidate

## Hardening Gates

Hardening gates are intentionally placed between feature groups. They are no-new-feature sprints for security, code quality, reusable-code cleanup, RLS/role review, performance, and regression testing.

Current gates:

- `P8`: auth, OAuth, MFA, tenant/global admin, and onboarding
- `P14`: transactions, contacts, brokers, and document checklist
- `P19`: templates, storage, PDF mapping, and generated documents
- `P25`: signing, integrations, billing, and workflow handoffs
- `P29`: AI, CRM, privacy, cost, and provider adapters
- `P32`: statewide property data, UI/UX, and final pre-release cleanup

Hardening rule:

```text
If a cleanup, abstraction, optimization, migration change, or security fix is likely to break existing behavior, Cursor must stop before making that change, explain the risk, and provide recommendations for moving forward.
```

Performance rule:

```text
Performance work should target measurable or clearly justified issues: repeated fetch loops, N+1 query patterns, oversized payloads, unnecessary client rendering, long-running PDF/AI/integration work in request paths, missing loading/error states, or avoidable provider calls.
```

Hardening gates may make low-risk cleanup changes only when tests already cover the behavior or new tests are added first.

## Per-Sprint QA Pattern

Every sprint in `choral-point-full-roadmap-prompt-sprints.json` now includes:

- `reviewChecklist`
- `testChecklist`
- `fullQaPrompt`
- `milestoneMarker`

Cursor should use those fields at the end of each sprint.

Full QA must always include these regression paths unless the sprint is planning-only:

- Login/logout
- OAuth login/signup where configured or mocked
- TC dashboard load
- All transactions list
- Create transaction
- Edit transaction
- Transaction detail
- Documents upload/list
- First Pass route
- Role dashboard route smoke: agent, buyer, seller, title, mortgage where seeded data allows
- BuildTrack project plan JSON remains valid

## Auth and OAuth Strategy

The current repo uses Supabase Auth and email/password login. Social OAuth should be added through Supabase Auth, not by introducing a second auth/session system.

Detailed strategy:

```text
buildtrack-cursor-port/auth-oauth-account-strategy.md
```

Recommended priority:

- Google
- Microsoft/Azure
- Apple
- Facebook
- LinkedIn OIDC
- Yahoo as custom OAuth/OIDC or identity-broker research
- Slack as a team integration/login option later
- GitHub for developer/admin-only contexts if useful

Critical rule: OAuth sign-up must not create privileged TC/admin/broker access unless the user came through an invite, admin approval, or another controlled onboarding path.

## Tenant and Global Admin Strategy

OAuth made this boundary important: a user may authenticate successfully, but that does not mean they should automatically gain tenant or platform access.

Detailed strategy:

```text
docs/choral-point-roadmap/tenant-global-admin-boundaries.md
```

Short version:

- Global admins manage the platform.
- Global admins create/suspend tenants, appoint tenant admins, set license limits, and manage global resources such as NMAR/global templates.
- Tenant admins manage only their tenant.
- Tenant admins invite/approve/revoke tenant users within license limits.
- Tenant admins cannot grant global admin, manage another tenant, exceed licenses, or mutate global NMAR/template/provider resources.
- OAuth users remain pending until invite/approval/role mapping succeeds.

## AI Insertion Points

AI should be provider-neutral. Do not build Choral Point around only Anthropic. The AI layer should support OpenAI, Anthropic, Google Gemini/Vertex AI, OpenRouter-compatible gateways, and future providers through adapters.

Detailed cost and wiring guide:

```text
buildtrack-cursor-port/ai-provider-cost-and-wiring-guide.md
```

Current repo already has foundations:

- AI First Pass workflow
- `first_pass_status`
- document extraction columns
- Anthropic dependency
- MLS/property integration stubs
- audit log and activity trails

Recommended AI insertion points:

1. Intake assist
   - Suggest missing fields from address, MLS, uploaded forms, or copied legal description.
   - Never overwrite user data without explicit accept.

2. Property/legal description assist
   - Help summarize public property record, county assessor/GIS, ATTOM/provider, or EagleWeb copy-paste text.
   - Keep source text and confidence visible.
   - Treat Valencia County as one county connector, not the statewide model.

3. Smart transaction search
   - Natural-language search across address, MLS, parties, brokers, notes, documents, and status.

4. Template field mapping suggestions
   - AI proposes PDF field-to-app-field mappings.
   - Admin must approve.

5. Missing-data explanation
   - Before PDF generation, explain what is missing and where the TC should enter it.

6. Package completeness review
   - AI reviews selected documents against package rules.
   - It suggests gaps but does not approve compliance.

7. Activity summary
   - Summarize AI pass, human pass, document events, messages, and audit events.

8. Task/reminder suggestions
   - Suggest follow-up tasks from transaction status, close date, document status, and package gaps.

9. Broker/client communication drafts
   - Draft messages or emails, requiring human send.

10. Help/copilot
   - Contextual help inside TC/admin/broker workflows.

11. Statewide New Mexico property lookup assist
   - Normalize property data returned from a licensed statewide provider or county source.
   - Extract legal descriptions from pasted county text when no API is available.
   - Require human confirmation before writing suggested fields to transaction intake.

AI safety rules:

- No single hard-coded AI provider.
- Admin can choose provider/model per feature.
- Every AI request logs provider, model, feature, token usage, and estimated cost when available.
- Tenant budget and per-request token limits should be configurable.
- No AI auto-sending documents for signature.
- No AI approving template mappings.
- No AI changing legal/contract fields without human confirmation.
- Every AI output should have an audit trail and feature source.
- Deterministic/manual workflows must remain available.

## Statewide New Mexico Property Data Strategy

Do not build the property-data workflow around Valencia County only. Choral Point needs a statewide New Mexico approach for every county where a TC may work.

Detailed strategy:

```text
buildtrack-cursor-port/statewide-nm-property-data-strategy.md
```

Planning stance:

- Use a licensed statewide/national property-data provider first when configured.
- Keep the provider optional so the app remains stable without paid credentials.
- Store county sources in a registry instead of hard-coding county-specific behavior.
- Support address, parcel/account/APN, and manual copy/paste lookup paths.
- Preserve source metadata, retrieval timestamps, and confidence/source notes for every imported field.
- Do not scrape county portals unless terms, authentication, robots policy, and reliability have been reviewed and approved.
- If structured lookup is unavailable, allow manual entry and optional AI extraction from pasted source text with human confirmation.

## CRM Strategy

The transcript indicates brokers are assessing CRM-style tools, and the first brokers work through Coldwell Banker tooling that uses Delta.

Recommended strategy:

- Build CRM-lite inside Choral Point only where it directly supports TC workflow.
- Add a provider-neutral CRM adapter layer for external sync.
- Treat external CRMs as optional integrations, not required for Choral Point core stability.
- Keep a separate-app option open if CRM grows beyond transaction coordination.

### CRM-Lite Features to Add Inside Choral Point

Good fit for this product:

- Contacts
- Contact categories and subcategories
- Broker-client flag
- SOI categorization
- Lead temperature: hot / warm / nurture / inactive
- Touch history
- Follow-up tasks
- Notes
- Broker/client relationship graph
- Transaction relationship history
- Import/export CSV
- External CRM IDs per contact/provider

Not recommended for core MVP:

- Full marketing campaign builder
- Mass email platform
- Social media automation
- Website lead capture platform
- Brokerage-wide CRM replacement

### CRM Integration Candidates

DeltaNET / Delta Media Group:

- Priority candidate because initial Coldwell Banker brokers reportedly use Delta.
- Public materials describe DeltaNET as an all-in-one real estate CRM/marketing/back-office platform.
- Public API documentation was not found in this pass.
- Treat as `api_status=unknown_private_or_partner`.
- Next action: ask brokers/Coldwell Banker/Delta support whether DeltaNET supports API access, data export, webhook, lead/contact import, or partner integration.

Lofty:

- Has public Open API documentation.
- Supports OAuth 2.0 and API key modes.
- Useful for contacts/leads/tasks if a broker uses Lofty.
- OAuth is preferred; API-key mode has lower operational safety and rate-limit constraints.

Follow Up Boss:

- Has REST API documentation.
- Good candidate for contacts, people/leads, notes, and follow-up activity.
- Requires broker/customer API credentials and terms review.

MoxiWorks / MoxiCloud:

- Has public MoxiCloud API reference.
- Good candidate where brokerages are on MoxiWorks/MoxiEngage.
- Access may require partner credentials/approval.

Provider-neutral CRM adapter should support:

- Provider name
- Auth mode
- External contact id
- Pull contacts
- Push/update contact
- Push note/activity
- Push task/reminder where provider supports it
- Sync status
- Last sync timestamp
- Conflict handling policy

## Sources Checked for CRM API Availability

- [Delta Media Group](https://www.deltamediagroup.com/) - confirms DeltaNET CRM/product positioning.
- [DeltaNET App Store listing](https://apps.apple.com/us/app/deltanet/id1564122763) - confirms DeltaNET CRM, contact/activity, marketing automation context.
- [DeltaNET 7 launch article](https://www.deltamediagroup.com/in-the-news/2023/09/14/delta-media-launches-deltanet-7-real-estate-s-most-customizable-automated-ai-powered-crm-based-digital-marketing-platform) - confirms AI/automation CRM platform positioning.
- [Lofty Open API](https://api.lofty.com/docs/reference) - confirms OAuth 2.0 and API key authentication.
- [Lofty Help Center API/OAuth article](https://help.lofty.com/hc/en-us/articles/4405826620571-Chime-API-OAuth-2-0) - confirms Open API/developer platform options and rate-limit differences.
- [Follow Up Boss API docs](https://docs.followupboss.com/) - confirms REST API.
- [MoxiCloud API Reference](https://moxiworks-platform.github.io/api.html) - confirms MoxiCloud API documentation.
