# Production and demo deployment

This document explains how **local development**, **hosted Netlify**, **environment variables**, and **demo seeding** relate to each other.

Related docs:

- [`.env.example`](../.env.example) — full variable list and comments  
- [`docs/supabase-configuration.md`](supabase-configuration.md) — Supabase keys, migrations, Auth URLs  
- [`docs/deployment-online-testing.md`](deployment-online-testing.md) — hosted QA checklist, MCP note  
- [`netlify.toml`](../netlify.toml) — Netlify build + Next plugin  
- [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) — CI test job + Netlify deploy  

---

## Local vs hosted (important distinction)

| Concern | Local development | Netlify (production / previews) |
|--------|-------------------|----------------------------------|
| Where config lives | `.env.local` at repo root (gitignored) | **Site → Environment variables** in [Netlify](https://app.netlify.com) |
| Is `.env.local` uploaded when you deploy? | **No.** Nothing automatically copies your laptop file to Netlify. You **paste or sync** the same *names and values* into Netlify (or use CLI). |
| Build runs where | Your machine (`npm run build`) or CI | Netlify’s build containers |
| Supabase target | Whatever URLs/keys you put in `.env.local` | Whatever URLs/keys are set in Netlify for that context |

The site is **designed to run on the web** via Netlify (or another host). If production misbehaves, it is usually **missing/wrong env vars**, **migrations not applied** to the Supabase project behind those keys, or **Supabase Auth redirect URLs** not including your deployment domain—not an inherent limit that the app only runs locally.

---

## Environment variables: what goes where

### Local only

- Copy [`.env.example`](../.env.example) → `.env.local` (never commit `.env.local`).
- For local UAT/demo seeding, see comments in `.env.example` for `NEXA_SKIP_MFA`, `ALLOW_UAT_SEED`, etc.

### Netlify (production / demo URL)

Configure variables in the Netlify UI for each scope you use (**Production**, **Deploy Previews**, **Branch deploys** as needed). Values must be **non-empty** where required—placeholder names or wrong hosts (e.g. setting `NEXT_PUBLIC_SUPABASE_URL` to your Netlify site URL) will break Auth/API calls.

### Minimum set for a working hosted login + API

Align with [`scripts/export-env-for-netlify.sh`](../scripts/export-env-for-netlify.sh) **REQUIRED** list:

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://<ref>.supabase.co`), **not** your Netlify hostname |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **anon** `public` key (JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** secret — server-side only; never expose to the browser |
| `NEXT_PUBLIC_APP_URL` | Canonical public URL of the deployment, e.g. `https://nexa-tc-application.netlify.app` |

Optional but common: `SUPABASE_ATTACHMENTS_BUCKET`, Upstash (`UPSTASH_*`), Inngest keys, Postmark, DocuSign, etc.—see `.env.example`.

### Build-time vs runtime (`NEXT_PUBLIC_*`)

`NEXT_PUBLIC_*` variables are inlined into the client bundle at **build time** on Netlify. After changing them, trigger a **new deploy**. Server-only secrets (e.g. `SUPABASE_SERVICE_ROLE_KEY`) are available to serverless/API routes at **runtime** and must still be set in Netlify.

### Helper script

From the repo root, after `.env.local` is filled:

```bash
bash scripts/export-env-for-netlify.sh
```

This prints suggested `netlify env:set` lines (secrets masked in stdout) so you can mirror local values into Netlify without committing them.

---

## Netlify configuration (`netlify.toml`)

- **Build:** `npm run build`, **publish** `.next`, **`@netlify/plugin-nextjs`** for Next.js App Router/API routes.
- **`NEXT_PUBLIC_APP_URL`** under `[context.production.environment]` may still show a placeholder domain—**override** with your real site URL in the Netlify UI so production builds use the correct canonical URL.
- If `/api/*` returns HTML 404 instead of JSON on Netlify, verify the Next runtime plugin is active and review Netlify Next.js docs; the repo also documents redirect nuances in [`docs/deployment-online-testing.md`](deployment-online-testing.md).

---

## Supabase (hosted project behind Netlify)

1. **Migrations:** Apply everything under [`supabase/migrations/`](../supabase/migrations/) to the **same** database project your env vars reference (`supabase db push`, Dashboard SQL, or pipeline).
2. **Auth URLs:** In Supabase Dashboard → **Authentication → URL configuration**, add your deployment origin(s), e.g. `https://your-site.netlify.app` and `https://your-site.netlify.app/**` as redirect URLs. Local dev: include `http://localhost:3000` / `http://localhost:3000/**` when testing locally against cloud Supabase.

Details: [`docs/supabase-configuration.md`](supabase-configuration.md).

---

## Demo data and seeding (`scripts/seed.ts`)

| Environment | Approach |
|-------------|----------|
| **Local** | With service role + `ALLOW_UAT_SEED=1`, run `npx tsx --env-file=.env.local scripts/seed.ts` (or `npm run seed:uat`). Demo accounts are defined in [`scripts/uat-constants.ts`](../scripts/uat-constants.ts). |
| **Staging / preview** | Prefer a **dedicated Supabase project** + matching Netlify env (preview context). Run seed only when you intend to reset demo data. |
| **Production** | **Do not** casually seed production. `scripts/seed.ts` includes safety gates (`ALLOW_UAT_SEED`, `ALLOW_UAT_SEED_IN_PROD`). Wiping/recreating tenants affects real data. |

---

## GitHub Actions

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) documents required **repository secrets** (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, Netlify token/site id, etc.). CI creates a temporary `.env.local` for tests and deploy; it does **not** replace configuring Netlify’s site env for live traffic.

---

## Pre-flight checklist (production / shared demo URL)

- [ ] Netlify env vars set for **Production** (and Preview if needed)—especially the four minimum variables above, all **non-empty** and pointing at a real Supabase project  
- [ ] `NEXT_PUBLIC_APP_URL` matches the URL users open in the browser  
- [ ] Supabase migrations applied to that project  
- [ ] Supabase Auth redirect URLs include the Netlify domain  
- [ ] No secrets committed to git  
- [ ] After env changes: **redeploy** so client/server pick up new values  

---

## Local-only Supabase (no cloud dashboard)

If you cannot use Supabase.com signup from your network, you can run **Supabase locally via Docker** and copy CLI-printed keys into `.env.local`. That path is for **development only**; hosted Netlify still needs cloud (or separate orchestration) for production unless you change architecture.

See team notes outside the repo if maintained, or [`docs/supabase-configuration.md`](supabase-configuration.md) § optional local stack.
