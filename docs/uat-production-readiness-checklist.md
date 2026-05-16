# UAT to production readiness checklist

## Remove or disable before production

- Set `UAT_ISSUES_ENABLED` and `NEXT_PUBLIC_UAT_ISSUES_ENABLED` blank/false.
- Ensure `NEXA_SKIP_MFA`, `ALLOW_UAT_SEED`, and `ALLOW_UAT_SEED_IN_PROD` are blank in production.
- Remove seeded UAT tenants, users, transactions, documents, contacts, messages, tasks, invoices, and generated artifacts from the production database.
- Remove or rotate local/test-only credentials, OAuth redirect URLs, webhook secrets, invite secrets, and sandbox integration keys.
- Confirm test email addresses, fake broker/client contacts, sample MLS records, sample invoices, and sample PDFs are absent from production.
- Review storage buckets for seeded PDFs, fixture uploads, generated PDFs, and orphaned test objects.
- Confirm debug logging, permissive CORS/origin assumptions, localhost URLs, and preview-domain redirect URLs are not present in production env.

## Verify before launch

- Production Supabase URL, anon key, service role key, auth redirect URLs, site URL, and custom SMTP/email configuration.
- Postmark sender/domain verification plus `EMAIL_FROM` and `MARKETING_REQUEST_TO`.
- Upstash credentials for rate limits and invite replay protection.
- MFA policy, RLS policies, role redirects, CSRF, login throttling, and password recovery flow.
- Netlify production env vars, custom domain, HTTPS certificate, branch/deploy context, and form/webhook endpoints.
- DocuSign, ATTOM, MLS, Inngest, inbound email, and any provider-specific production credentials only if those integrations are intended to be live.
- Fresh migration run from zero, clean seedless production smoke, and a backup/rollback plan before DNS cutover.

## Preserve before cleanup

- UAT issue submissions and enhancement requests.
- Approved copy/content changes discovered during UAT.
- Accepted design decisions, tenant settings worth reusing, and hardening findings.
- A list of defects closed, deferred, or promoted into backlog before deleting the UAT dataset.
