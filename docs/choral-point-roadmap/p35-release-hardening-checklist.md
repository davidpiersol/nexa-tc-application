# P35 release hardening checklist

## Validation already run

- `npm run verify`
- Focused property-lookup unit tests
- Remote Supabase migration status check
- Netlify preview build/deploy

## Still required before human-approved rollback checkpoint

- Fresh-database migration reset from zero
- Seed verification against a clean local stack
- Full browser regression across TC, admin, broker/agent, buyer, seller, title, and mortgage routes
- Focused browser smoke for statewide property lookup with fixture data
- Production-equivalent environment review for Supabase, Netlify, Postmark, and request-demo delivery
- Human approval before stable tag / rollback branch

## Rollback rule

Do not create the P35 rollback tag until the checks above pass and David explicitly approves the release candidate.
