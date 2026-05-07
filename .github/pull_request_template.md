## Summary

- What changed and why?

## Local Review (Required Before Requesting Review)

- [ ] I ran `npm run verify:with-clean-dev -- --verify-only`
- [ ] I ran `npm run dev` and manually reviewed impacted routes/components
- [ ] I validated seeded-user behavior if auth/role routes were changed
- [ ] I captured any known gaps/risks below

## CI/CD Promotion Checklist

- [ ] This branch is ready for PR review (not a direct `main` push)
- [ ] I understand merge to `main` triggers CI deploy flow in `.github/workflows/deploy.yml`
- [ ] If I needed a hosted QA URL, I used a non-prod deploy (`npx --yes netlify-cli deploy --build`)
- [ ] I will only use production deploy (`--prod`) when explicitly intended

## Versioning and Release Notes

- [ ] I updated `VERSION` if required by `v.X.Y.Z` rules
- [ ] I updated `CHANGELOG.md` for user-facing changes

## Test Plan

- Steps to reproduce and verify:
  1.
  2.
  3.

## Risks / Follow-ups

- Risks:
- Follow-ups:
