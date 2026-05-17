# Supabase configuration (local & team testing)

This app uses **Supabase Auth**, **Postgres + RLS**, **Storage**, and optionally **Realtime**. There is no magic seed data—configure a project and apply migrations yourself.

## 1. Create a project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → **New project**.
2. Choose region, set a database password (store safely), wait for provisioning.

## 2. API keys (→ `.env.local`)

From **Project Settings → API**:

| Variable | Where / what |
| -------- | ------------ |
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon** `public` key (safe in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key — **server-only**, never expose to client or commit |

Copy [`.env.example`](../.env.example) to `.env.local` and paste values:

```bash
cp .env.example .env.local
# edit .env.local
```

Optional: `npm run env:init` creates `.env.local` only if it does not exist.

## 3. Apply database migrations

Migrations live in [`supabase/migrations/`](../supabase/migrations/).

**Option A — Supabase CLI (recommended)**

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Link the project: `supabase link --project-ref <your-project-ref>` (ref is in Dashboard URL).
3. Push migrations: `supabase db push`

**Option B — SQL Editor**

1. Open **SQL** in the Dashboard.
2. Run each migration file **in filename order** (by timestamp prefix), or paste combined SQL if your process allows.

After migrations, confirm tables exist under **Table Editor**.

### Data API grants for new public tables

Supabase requires explicit grants for `public` tables that should be reachable through the Data API (`supabase-js`, PostgREST, or GraphQL). For every future migration that creates a table in `public`, include the full access shape in the same feature migration:

1. `GRANT` table privileges to the roles that should reach it through the Data API.
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
3. Add RLS policies for each allowed operation.

Choral Point should not grant broad `anon` table access by default. Most app tables should be granted to `authenticated` and `service_role`, with RLS policies deciding tenant, role, row, and operation access. Anonymous invite/signup flows should prefer signed tokens and API routes rather than direct unauthenticated table reads.

When tightening grants on an existing project, `REVOKE` inherited/default privileges first, then add the intended `GRANT` statements. Existing Supabase projects may already show broad `anon`/`authenticated` privileges until a hardening migration normalizes them.

## 4. Storage

If you use document uploads or inbound email attachments:

1. **Storage → New bucket** named `attachments` (or match `SUPABASE_ATTACHMENTS_BUCKET` in `.env.local`).
2. Policies are defined in migrations (e.g. tenant-scoped paths). If something fails on upload, verify bucket name + RLS policies.

## 5. Auth URLs for local development

**Authentication → URL configuration**:

- **Site URL:** `http://localhost:3000` (or your dev port).
- **Redirect URLs:** add `http://localhost:3000/**` and any OAuth callback paths your app uses.

Without this, magic links and redirects after login can fail.

### OAuth / social login

1. **Dashboard → Authentication → Providers:** enable each identity provider you need (Google, Azure / Microsoft, Apple, Facebook, LinkedIn OIDC). Paste client IDs and secrets from each vendor console into Supabase—never commit secrets to git.

2. **Redirect URLs:** allow your app callback route (the PKCE exchange endpoint):
   - Local: `http://localhost:3000/auth/callback` (or use `http://localhost:3000/**`).
   - Deployed: `https://<your-domain>/auth/callback` (and preview URLs if you use them).

3. **`NEXT_PUBLIC_APP_URL`** should match the canonical browser origin used for OAuth redirects (same scheme/host as users see), especially behind proxies.

4. **`NEXT_PUBLIC_OAUTH_PROVIDERS`** — comma-separated keys exposed as buttons in the UI: `google`, `azure`, `apple`, `facebook`, `linkedin_oidc`. Leave empty until providers are configured.

5. **Invitations:** OAuth users still receive `tenant_id` and `role` only through the invite cookie flow (`/api/auth/oauth/start` + `/auth/callback`) or existing admin provisioning—not through anonymous IdP signup alone.

6. **Yahoo / custom IdPs:** Supabase does not ship a Yahoo shortcut; use custom OAuth/OIDC or an identity broker per `docs/choral-point-roadmap/auth-oauth-account-strategy.md`.

## 6. MFA (TC / admin paths)

Middleware may require **AAL2** for privileged roles. Enable MFA under Supabase Auth for test users and complete enrollment at `/auth/mfa` before restricted dashboard/API calls succeed.

## 7. Users and roles (not automatic)

The app expects rows in **`public.users`** tied to **`auth.users`** with `tenant_id` and `role` (`tc`, `buyer`, …). Creating only an Auth user is not enough—you must insert/link profile rows per your RLS model (Dashboard SQL, invite flow, or admin script).

See also: [`.env.example`](../.env.example) for encryption keys, invite JWT, and integration secrets.

## 8. Optional: local Supabase stack

For offline DB work you can run `supabase start` (Docker) per [local development docs](https://supabase.com/docs/guides/cli/local-development). Point `NEXT_PUBLIC_SUPABASE_*` at the local keys the CLI prints. Still apply the same migration files.
