# Choral Point production launch guide

This guide is the starting checklist for the later production-launch sprint at `choralpoint.com`.

## Decisions to make first

1. Confirm the production host. The repository already contains `netlify.toml`, so Netlify is the most natural first deployment path unless the team deliberately chooses another host.
2. Confirm where DNS for `choralpoint.com` is managed.
3. Confirm production email sending domain and sender identity for Postmark.

## Production prerequisites

- Dedicated production Supabase project and keys
- Production Postmark server token
- Verified sending domain and `EMAIL_FROM`
- `MARKETING_REQUEST_TO=info@choralpoint.com`
- Production `NEXT_PUBLIC_APP_URL=https://choralpoint.com`
- Required Upstash, DocuSign, Plaid, and other provider credentials only when those features are approved for production

## Suggested launch sequence

1. Create the production site in the chosen host.
2. Load production environment variables from the repo inventory; never copy local `.env.local` blindly.
3. Deploy to a preview URL and run smoke tests across `/`, `/login`, public marketing pages, and `/request-demo`.
4. Verify Postmark delivery from the production sender to `info@choralpoint.com`.
5. Add the custom domain, configure redirects, and wait for HTTPS issuance.
6. Update DNS only after preview validation passes.
7. Run live smoke again after cutover.
8. Record the release tag, rollback plan, and monitoring checks.

## Later sprint deliverables

- Exact host setup steps
- DNS record plan
- Environment-variable matrix
- Postmark domain-verification checklist
- Rollback runbook
- Launch-day smoke checklist
