# UAT Remediation Sprint — v4.38.0-uat

## Objective

Clear the first UAT friction set without expanding scope beyond what testers need to continue product validation.

## Fix now

1. **Tenant creation validation**
   - Empty optional fields are accepted.
   - Successful save returns the admin to the tenant list state.
2. **Dashboard navigation continuity**
   - Global and tenant admin navigation persists on shared routes such as UAT issues.
   - Choral Point logo returns the signed-in user to their role dashboard.
   - Add a visible back button in the dashboard header.
3. **Dashboard footer**
   - Add trademark, Choral Point link, and support email link across authenticated dashboard pages.
4. **Profile vs Settings clarity**
   - Profile owns personal/account data.
   - Settings owns workspace preferences.
5. **Tenant user create flow**
   - After create, return attention to the tenant user list.
6. **Dashboard identity polish**
   - Add time-of-day greeting on overview/dashboard pages.
   - Show the person’s name in the account menu when available.
7. **Global admin help refresh**
   - Update admin help copy to match tenant drilldown, profile, and reset flows.

## Defer into design + build follow-up

### Multi-role users / role switching

This is not a cosmetic enhancement. It requires:

1. replacing single-role assumptions with a user-role-assignment model;
2. selecting an active role/workspace context per session;
3. updating redirects, navigation, permissions, invitations, and audit behavior;
4. adding a role switcher with clear tenant boundaries;
5. migration/backfill for existing users.

Recommended next implementation sprint: model the data and routing contract first, then ship the switcher once permissions are proven.
