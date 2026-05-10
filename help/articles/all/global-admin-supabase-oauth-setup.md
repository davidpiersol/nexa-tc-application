# Global Admin: Supabase OAuth Setup Checklist

This guide is for the **global admin** who configures platform-level auth before tenant admins start onboarding users.

## What this controls

- Which social providers are available on `login`, `signup`, and invite acceptance.
- Which redirect URLs Supabase accepts for OAuth callback.
- Whether OAuth users can be provisioned through invite flow without weakening role and tenant controls.

## 1) Configure provider secrets in Supabase Dashboard

In **Supabase Dashboard → Authentication → Providers**, enable only the providers you want:

- Google
- Azure / Microsoft
- Apple
- Facebook
- LinkedIn OIDC

Store client IDs and secrets in Supabase provider settings.  
Do **not** commit provider secrets into the repository.

## 2) Configure callback URLs

Allow these redirect URLs in Supabase Auth URL configuration:

- Local: `http://localhost:3000/auth/callback`
- Production: `https://<your-domain>/auth/callback`
- Preview/staging domains as needed (same `/auth/callback` path)

Also keep **Site URL** aligned with the canonical app URL for each environment.

## 3) Configure app environment variables

In deployment env vars (and `.env.local` for local testing):

- `NEXT_PUBLIC_APP_URL` — canonical browser origin, no trailing slash.
- `NEXT_PUBLIC_OAUTH_PROVIDERS` — comma-separated provider keys:
  - `google`
  - `azure`
  - `apple`
  - `facebook`
  - `linkedin_oidc`

If `NEXT_PUBLIC_OAUTH_PROVIDERS` is empty, OAuth buttons are hidden.

## 4) Confirm invite-aware provisioning rules

- OAuth session creation uses Supabase Auth.
- Privileged access is still controlled by invite/admin provisioning (`public.users` + role/tenant mapping).
- OAuth users without approved mapping should remain in **Access pending**.
- MFA requirements for privileged roles remain enforced.

## 5) Validate quickly

1. Open `/login` and `/signup`; confirm only configured providers show.
2. Start OAuth; verify callback reaches `/auth/callback`.
3. Confirm invited OAuth user lands on role redirect after provisioning.
4. Confirm non-invited OAuth user lands on access pending.
5. Confirm privileged role MFA gate still applies.

## Notes for roadmap continuity

- Yahoo is tracked as custom OAuth/OIDC or identity-broker work, not a built-in provider button.
- This setup supports the next sprint where global admin and tenant admin responsibilities are separated.
