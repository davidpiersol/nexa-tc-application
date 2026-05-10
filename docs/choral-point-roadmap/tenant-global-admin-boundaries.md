# Tenant and Global Admin Boundaries

## Why This Exists

OAuth lets someone prove identity, but identity is not authorization.

Choral Point needs two separate admin levels:

- Global admin: platform owner/operator.
- Tenant admin: account owner/operator for one tenant/group.

This prevents an invited broker, TC, buyer, seller, or vendor from gaining the wrong scope after OAuth sign-in.

## Global Admin Responsibilities

Global admins can:

- Create tenant accounts.
- Suspend/reactivate tenant accounts.
- Assign or remove tenant admins.
- Set tenant license/seat limits.
- View tenant license usage.
- Manage platform-level billing/license policy.
- Manage global NMAR/form templates and revisions.
- Manage global canonical PDF/template field keys.
- Manage global template categories, jurisdictions, and document metadata.
- Manage global provider catalogs, for example AI providers, signing providers, CRM providers, property-data providers.
- Manage statewide property-data source registry.
- Review platform-wide audit/security events.

Global admins should not routinely perform tenant operations unless acting as support with audit logging.

## Tenant Admin Responsibilities

Tenant admins can:

- Invite users into their own tenant.
- Approve pending invited users for their own tenant.
- Revoke/deactivate users in their own tenant.
- Assign tenant-scoped roles allowed by policy.
- Manage tenant account settings.
- Manage tenant broker/client/user records.
- Manage tenant signing preferences and tenant integration credentials.
- Manage tenant package/default document preferences where global policy allows.
- View tenant license usage.

Tenant admins cannot:

- Grant global admin.
- Create another tenant.
- Manage another tenant's users or data.
- Exceed license limits.
- Mutate global NMAR templates or global template versions.
- Mutate global provider catalogs.
- Change platform-wide settings.

## OAuth and Invite Rules

- OAuth authentication creates or resumes identity only.
- Access requires tenant and role assignment.
- Tenant/role assignment comes from invite redemption, tenant admin approval, global admin approval, or controlled onboarding.
- If an OAuth user has no valid invite or approval path, route them to pending/manual review.
- If an OAuth email matches an invite, reconcile deliberately and audit the event.
- If an OAuth provider does not return a verified email, block or route to manual review.

## Role Model

Minimum roles to distinguish:

- `global_admin`
- `tenant_admin`
- `tc`
- `broker`
- `buyer`
- `seller`
- `title`
- `mortgage`

Use reusable permission helpers so code does not scatter raw string checks.

## License Model

Track per tenant:

- License limit
- Active user count
- Pending invite count
- Role counts
- License status

Decide whether pending invites consume seats. Recommended: pending invites reserve seats so tenant admins cannot over-invite.

## Audit Events

Audit:

- Tenant created/suspended/reactivated
- Tenant admin assigned/removed
- License limit changed
- User invited
- User approved/rejected
- User revoked/deactivated
- Over-license invite blocked
- OAuth user routed to pending/manual review
- Role changed

## Build Prompt

```text
Implement Choral Point tenant-admin/global-admin separation after OAuth.

Requirements:
- Separate platform-level global admin from tenant-level admin.
- Global admins create/suspend tenants, assign tenant admins, set license limits, and manage global resources such as NMAR/global templates, provider catalogs, and statewide property-data source registry.
- Tenant admins invite, approve, revoke, and manage users only inside their own tenant and only within license limits.
- Tenant admins cannot grant global admin, manage other tenants, exceed licenses, or mutate global templates/provider catalogs.
- OAuth-created users remain pending/onboarding unless matched to an invite or approved by the correct admin path.
- Add reusable permission helpers for global_admin, tenant_admin, and tenant-scoped roles.
- Add or update RLS/API guards so tenant isolation and global admin visibility are enforced.
- Add audit events for tenant, license, invite, approval, revoke, and role changes.
- If these changes would break existing auth or tenant behavior, stop before making that change and explain the risk with recommendations.
```

## Test Checklist

- Global admin can create/manage tenant accounts.
- Global admin can assign/remove tenant admins.
- Global admin can set license limits.
- Tenant admin can invite users within tenant.
- Tenant admin cannot exceed license limits.
- Tenant admin cannot grant global admin.
- Tenant admin cannot manage another tenant.
- Tenant admin cannot mutate global NMAR/template/provider resources.
- OAuth users without valid invite/approval remain pending.
- RLS enforces tenant isolation.
- Audit events are written for admin/license/invite/approval actions.
