/** Fixed IDs for local UAT seed + tests (deterministic across runs). */
export const UAT_TENANT_ID = "11111111-1111-4111-8111-111111111111";
export const UAT_PLATFORM_TENANT_ID = "22222222-2222-4222-8222-222222222222";
export const UAT_TRANSACTION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
/** TC is intentionally not a party — middleware buyer-route isolation. */
export const UAT_OTHER_TRANSACTION_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

export const UAT_USERS = {
  g_admin: { email: "g_admin@nexa.test", role: "global_admin" as const, tenant: "platform" as const },
  t_admin: { email: "t_admin@nexa.test", role: "tenant_admin" as const, tenant: "company" as const },
  tc: { email: "tc@nexa.test", role: "tc" as const, tenant: "company" as const },
  agent: { email: "agent@nexa.test", role: "broker" as const, tenant: "company" as const },
  buyer: { email: "buyer@nexa.test", role: "buyer" as const, tenant: "company" as const },
  seller: { email: "seller@nexa.test", role: "seller" as const, tenant: "company" as const },
  mortgage: { email: "mortgage@nexa.test", role: "mortgage" as const, tenant: "company" as const },
  title: { email: "title@nexa.test", role: "title" as const, tenant: "company" as const },
  admin: { email: "admin@nexa.test", role: "admin" as const, tenant: "platform" as const },
} as const;

export const UAT_PASSWORD = "TestNexa2024!";
