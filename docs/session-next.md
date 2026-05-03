# Next session handoff

**Placemarker for return visits** — read this file first, then [`docs/wiki/progress.md`](wiki/progress.md).

---

## Where the build is

| Item | Value |
|------|--------|
| **Version** | See [`VERSION`](../VERSION) — **`v3.0.0`** (NEXA branding / Tailwind `nexa.*` milestone; **graphics detour** — revisit against client sign-off before locking visuals). |
| **Git remote** | `origin` — branch **`main`**, tag **`v3.0.0`** after release (prior tags **`v2.1.x`**, etc.). |
| **Build guide position** | **Chapter 4 · Step 11** — *Build all external API integrations* ([`nexa_build_guide.md`](../nexa_build_guide.md)). |

---

## What was validated (automated)

Run anytime:

```bash
npm run verify    # lint + tsc + vitest + next build
npm run smoke      # with dev server: npm run smoke -- http://localhost:3000
```

---

## Permissions / access to request (for later phases)

| Area | Why grant |
|------|-----------|
| **Supabase project** | Real **`NEXT_PUBLIC_SUPABASE_*`** + **`SUPABASE_SERVICE_ROLE_KEY`** for login, MFA, invite redeem, RLS-backed APIs — placeholders allow UI smoke only. |
| **Upstash Redis** | Rate limits + invite replay ID storage (`UPSTASH_*`). |
| **Postmark** | Invite emails (`POSTMARK_SERVER_TOKEN`, `EMAIL_FROM`). |
| **Third-party APIs (Step 11+)** | MLS, DocuSign, Plaid, etc., per [`nexa_build_guide.md`](../nexa_build_guide.md) Chapter 4. |
| **GitHub Actions secrets** | If you enable CI in `.github/workflows/ci.yml`, add nothing beyond repo checkout unless you add deploy jobs. |
| **Cursor / IDE** | Network permission for `npm`, `git push`; optional **Playwright** browser install if you add E2E tests later (`npx playwright install`). |

---

## NEXT STEP (explicit)

**You are clear to start Step 11:** no dependency on the **`v3.0.0`** branding detour for backend integration work. Implement external integration clients (MLS, ATTOM/clerk typo in guide, DocuSign, Postmark inbound, Plaid) under `lib/` per build guide — then wire webhooks and audit paths. Schedule a separate **graphics cleanup** milestone when client assets are final.

---

*Updated when QA / version bumps land.*
