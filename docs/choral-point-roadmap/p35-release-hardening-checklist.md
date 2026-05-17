# P35 release hardening checklist

## Completed in this pass

- Fresh-database migration reset from zero
- Clean UAT seed verification
- Full local UAT harness, including role redirects for global admin, tenant admin, TC, agent, buyer, seller, mortgage, title, and admin
- Unit test suite
- Typecheck and production build
- Full browser regression suite after CRM test-contract refresh
- Focused browser smoke for statewide property lookup with manual review + acceptance
- Remote Supabase migration push through the statewide county registry completion

## Verified coverage

- Login, TC dashboard, transaction detail, documents, First Pass, contacts, brokers, vendor assignment, archive, billing, CRM connections, broker workspace, buyer workspace, and statewide property lookup
- Property lookup tenant-scoped RLS tables and manual-review persistence flow
- No-scrape rule retained for county fallback sources

## Remaining before a human-approved rollback checkpoint

- Production-equivalent environment review for Supabase, Netlify, Postmark, and request-demo delivery
- One real licensed ATTOM fixture when available, so provider normalization can be tested against reality rather than only conservative assumptions
- Human approval before stable tag / rollback branch

## Rollback rule

Do not create the P35 rollback tag until David explicitly approves the release candidate.
