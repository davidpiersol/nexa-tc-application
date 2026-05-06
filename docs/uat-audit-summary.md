# UAT audit summary (automated pipeline prep)

## STEP 1 — Scan & fix

### TypeScript (`npx tsc --noEmit`)

- **Result:** passes with zero errors after implementing UAT scripts and middleware/API additions.

### Production build (`npx next build`)

- **Result:** succeeds.

### API routes (`app/api/**/route.ts`)

- Audited handlers export appropriate HTTP methods (`GET`, `POST`, `PATCH`, etc.). No invalid exports found.
- **Added:** `GET /api/auth/role-redirect` — role-based landing URL after login.
- **Added:** `GET /api/documents/[id]` — JSON with signed storage URL; respects RLS via Supabase server client.

### Default exports (`page.tsx`)

- Spot-checked app routes; all use `export default function … Page`. No fixes required.

### Environment variables

- Application reads keys documented in `.env.example`.
- **Added:** `NEXA_SKIP_MFA` (documented in `.env.example`) so local UAT can bypass MFA for `tc`/`admin` when `scripts/run-local-uat.sh` runs (never enable in production).

### Supabase schema vs code

- Seed previously referenced fields not present in older migrations (`purchase_price`, `earnest_money`, `contract_date`, `tc_id`, `messages.is_internal`, `tasks.priority`, `sent_for_signature` document status).
- **Added migration:** `supabase/migrations/20260506100000_uat_schema_extensions.sql` so seeded data matches typed expectations.

### localhost hardcoding

- Grep for `localhost` in application TS/TSX/JS: **none** (URLs come from `NEXT_PUBLIC_APP_URL` / request URL).

### Behavioral fixes for UAT requirements

1. **Login rate limit without Upstash:** `enforce-login-rate-limit.ts` now uses an in-memory sliding window when Redis is unset so the “11th login → 429” check passes locally.
2. **MFA vs UAT:** Middleware respects `NEXA_SKIP_MFA` for privileged roles during automated runs.
3. **Role-based routing:** `/api/auth/role-redirect` + login form changes send each role to the correct dashboard prefix.
4. **RBAC:** Buyers/sellers/mortgage/title receive **403** on `/tc`; TCs receive **403** on `/buyer/[transactionId]` when they are not a party.

### Stub / route notes

- `GET/POST /api/checklists` remains a stub (`stubJson`). UAT exercises **`PATCH /api/checklist-items/[id]`** (implemented) instead of a nested `/api/checklists/.../items/...` path.

## Netlify / CI notes

- **`netlify.toml`** follows the requested template. If `/api/*` returns unexpected responses on Netlify, remove the `[[redirects]]` block for `/api/*` — the official Next.js runtime plugin normally routes API without that redirect.
- **GitHub Actions** runs seed + `scripts/uat.ts` + Playwright in one job so the dev server stays alive for HTTP tests.
