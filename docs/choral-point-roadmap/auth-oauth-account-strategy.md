# Auth and OAuth Account Strategy

## Current App State

Choral Point currently uses Supabase Auth. The existing login flow is email/password, and the signup page is a placeholder.

OAuth should be implemented through Supabase Auth so the app keeps one session model, one middleware path, and one RLS/JWT story.

## Provider Priority

Recommended initial providers:

- Google: best fit for Gmail and Google Workspace users.
- Microsoft/Azure: best fit for Outlook, Microsoft 365, Exchange, Teams, and calendar workflows.
- Apple: useful for buyer/seller/client access and privacy-sensitive users.
- Facebook: optional, useful for agent/broker social identity.
- LinkedIn OIDC: useful for professional identity, brokers, vendors, lenders, title reps.

Provider candidates to track:

- Yahoo: not assumed as built-in Supabase support; investigate custom OAuth/OIDC or use an identity broker such as Auth0, Firebase Auth, AWS Cognito, or WorkOS.
- Slack: useful later if team messaging becomes a core integration.
- GitHub: useful for developer/admin-only contexts, not broker/client MVP.
- WorkOS: future enterprise SSO/SAML option.
- Auth0/Firebase/AWS Cognito: identity-broker options if Choral Point needs providers beyond Supabase's built-in set.

## Account Creation Rules

- Email/password login remains available.
- OAuth login and signup use Supabase Auth.
- Public OAuth signup cannot create privileged TC/admin/broker access.
- Tenant and role assignment must come from invite redemption, tenant admin approval, global admin approval, or another controlled onboarding path.
- Buyer/seller/client self-service access can be considered later, but still needs transaction scoping.
- Existing MFA enforcement remains required for privileged roles.
- Provider secrets must be environment-configured and never committed.
- Redirect URLs must be documented for local, preview, and production environments.

Tenant/global admin boundaries are handled in the next sprint:

```text
docs/choral-point-roadmap/tenant-global-admin-boundaries.md
```

## Data and Role Mapping

OAuth-created users must still map to:

- `auth.users`
- `public.users`
- `tenant_id`
- `role`
- onboarding/invite state

If the OAuth provider returns an email that matches an invited user, the app should reconcile through a deliberate invite acceptance/account-linking flow.

If the OAuth provider returns no verified email, the app should route to a blocked or manual-review state.

## Build Prompt

```text
Implement Choral Point OAuth account creation and invite-aware signup using Supabase Auth.

Requirements:
- Keep Supabase Auth as the only app auth/session system.
- Add login/signup UI for configured social providers.
- Prioritize Google, Microsoft/Azure, Apple, Facebook, and LinkedIn OIDC.
- Track Yahoo as custom OAuth/OIDC or identity-broker investigation, not assumed built-in support.
- Preserve existing email/password login.
- Add or verify OAuth callback handling.
- Ensure OAuth-created users are mapped to public.users only through invite redemption, admin approval, or a controlled onboarding path.
- Do not allow public OAuth signup to create privileged TC/admin/broker access.
- Preserve MFA enforcement for privileged roles.
- Document provider env vars and redirect URLs.
- Add tests for provider config, callback routing, role assignment, duplicate email behavior, and MFA regression.
```

## Test Checklist

- Login page still supports email/password.
- Signup page no longer dead-ends.
- OAuth buttons render only for configured/allowed providers.
- OAuth callback handles success, error, and missing invite/onboarding state.
- Existing invited users can complete account setup through OAuth.
- Duplicate email/account-linking behavior is documented and tested.
- Privileged roles cannot self-register publicly.
- MFA middleware still redirects privileged users to MFA when needed.
- Role redirect still sends users to the correct dashboard.
- Provider secrets are not committed.

## Sources Checked

- [Supabase Social Login](https://supabase.com/docs/guides/auth/social-login)
- [Supabase Custom OAuth/OIDC Providers](https://supabase.com/docs/guides/auth/custom-oauth-providers)
