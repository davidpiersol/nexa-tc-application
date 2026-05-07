# PR and CI/CD workflow

This runbook defines how we move changes from local development to production safely.

## Short answer to your question

Yes. You can review changes locally before they are promoted to Netlify production.

In this repo, production promotion happens when code reaches `main` (GitHub Action deploy job) or when someone runs a manual Netlify production deploy command.

## Default flow (recommended)

1. Create/update a feature branch (do not work directly on `main`).
2. Run local checks and review in browser.
3. Open a PR.
4. Let CI run test/build/deploy gates.
5. Merge PR after approval.
6. Production deploy runs from `main`.

## Local review checklist (before PR)

From repo root:

```bash
npm ci
npm run verify:with-clean-dev -- --verify-only
npm run dev
```

Then review role-specific UI paths in browser (`/tc`, `/agent/:id`, `/buyer/:id`, etc.) with seeded users where applicable.

For a quick local reset + UAT data:

```bash
ALLOW_UAT_SEED=1 npm run seed:uat
```

## PR checklist

- Scope is focused and testable.
- `VERSION`/`CHANGELOG.md` updated when release semantics require it.
- No secrets committed (`.env.local` stays local).
- Local verify pass completed.
- Reviewer can follow a clear test plan.

## CI/CD behavior in this repo

GitHub workflow: `.github/workflows/deploy.yml`

- On push to `main`, CI runs:
  - TypeScript check
  - Build
  - UAT seed + scripted API checks
  - Playwright tests
- If test job passes, deploy job publishes to Netlify production.

This means **merge to `main` is a production promotion event**.

## Preview deploy options (before production)

### Option A: PR + CI only (no manual CLI deploy)

Use PR review plus local testing; do not merge until approved.

### Option B: Manual Netlify preview URL

Create a non-production deploy from your branch:

```bash
npx --yes netlify-cli deploy --build
```

This returns a unique draft URL for browser QA. It does not promote to production.

## Production promotion

Use one of:

- Merge approved PR to `main` (preferred; CI/CD path), or
- Manual production deploy (only when explicitly intended):

```bash
npx --yes netlify-cli deploy --build --prod
```

## Rollback note

If production needs rollback, redeploy a prior successful Netlify deploy from the dashboard or CLI instead of force-pushing git history.
