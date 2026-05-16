# P34 hardening review — statewide property data + UI polish

## Scope reviewed

- P32 public UI surfaces and request-demo flow
- P33 property lookup schema, provider selection, manual fallback, and transaction intake panel
- Auth, CSRF, RLS, and deployment-adjacent behavior touched by the preceding work

## Findings

### Low-risk fixes completed

- Kept request-demo email delivery server-side and CSRF-protected.
- Added a honeypot field without exposing it visually.
- Used a provider-first property lookup flow with ATTOM preferred when configured and manual text fallback otherwise.
- Required human confirmation semantics for extracted property suggestions.
- Modeled county sources as registry rows instead of hard-coding Valencia County.

### Risks reviewed and deferred

1. **Remote provider normalization is conservative.** ATTOM payload mapping is intentionally narrow until real licensed sample payloads are available.
2. **Manual extraction is heuristic.** It is safe because extracted fields remain suggestions, not silent writes.
3. **County automation remains blocked by design.** No scraping or automated portal behavior is enabled before legal/terms review.
4. **Request-demo delivery depends on production Postmark setup.** The code path exists, but production sending remains configuration-gated.

## Security / performance review

- Public request-demo route uses rate limiting, CSRF, and server-side email only.
- Property lookup routes require authenticated privileged actors.
- Property lookup tables are tenant-scoped via RLS and do not expose cross-tenant data.
- Large provider blobs are retained only in `property_lookup_runs.raw_snapshot`; the UI receives normalized suggestions rather than broad payloads.
- No repeated background polling or unnecessary client fetch loop was introduced.

## Recommendations before release hardening

- Capture one real licensed ATTOM response and add fixture-based normalization tests before calling P33 fully mature.
- Add browser smoke for the property lookup panel once seeded fixture data is available.
- Confirm request-demo sender/domain in Postmark before production cutover.
