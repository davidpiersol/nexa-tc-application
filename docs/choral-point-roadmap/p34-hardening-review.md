# P34 hardening review — statewide property data + UI polish

## Scope reviewed

- P32 public UI surfaces and request-demo flow
- P33 property lookup schema, statewide registry, provider selection, manual fallback, and transaction intake panel
- Auth, CSRF, RLS, and deployment-adjacent behavior touched by the preceding work

## Findings and low-risk cleanup completed

- Kept request-demo email delivery server-side and CSRF-protected.
- Added a honeypot field without exposing it visually.
- Completed an explicit all-county New Mexico registry so unsupported counties are modeled as manual-only rather than silently missing.
- Kept ATTOM/provider-first lookup preferred when configured, with manual text fallback otherwise.
- Added stored suggestion IDs plus accept/reject controls so extracted values remain human-reviewed before persistence.
- Updated stale browser assertions to match the current CRM and searchable-select UX contract.

## Security / performance review

- Public request-demo route uses rate limiting, CSRF, and server-side email only.
- Property lookup routes require authenticated privileged actors.
- Property lookup tables are tenant-scoped via RLS and do not expose cross-tenant data.
- Large provider blobs are retained only in `property_lookup_runs.raw_snapshot`; the UI receives normalized suggestions rather than broad payloads.
- No repeated polling, cross-tenant query, scraping automation, or avoidable client fetch loop was introduced.

## Deferred risks

1. **Remote provider normalization is conservative.** ATTOM payload mapping is intentionally narrow until real licensed sample payloads are available.
2. **Manual extraction is heuristic.** It is safe because extracted fields remain suggestions, not silent writes.
3. **County automation remains blocked by design.** No scraping or automated portal behavior is enabled before legal/terms review.
4. **Request-demo delivery depends on production Postmark setup.** The code path exists, but production sending remains configuration-gated.

## Validation completed

- `npm run typecheck`
- `npm run test`
- `npm run build`
- Fresh local `supabase db reset`
- Clean UAT seed
- Browser smoke including CRM connections, vendor assignment, and manual statewide property lookup acceptance flow
