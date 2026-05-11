import { describe, expect, it } from "vitest";
import {
  contactCategoryLabel,
  normalizeContactCategories,
  sortedContactCategoriesForUi,
} from "@/lib/contacts/categories";
import {
  canAccessContacts,
  canManageBrokerCredentials,
  canWriteContacts,
} from "@/lib/contacts/permissions";

describe("contacts category normalization", () => {
  it("deduplicates and keeps only known categories", () => {
    expect(
      normalizeContactCategories([
        "broker",
        "vendor",
        "broker",
        "invalid",
        "lender",
      ]),
    ).toEqual(["broker", "vendor", "lender"]);
  });

  it("uses paragraph case labels except TC/SOI and keeps Other last", () => {
    expect(contactCategoryLabel("tc")).toBe("TC");
    expect(contactCategoryLabel("soi")).toBe("SOI");
    const sorted = sortedContactCategoriesForUi();
    expect(sorted.at(-1)).toBe("other");
  });
});

describe("contacts permissions", () => {
  it("allows tc/admin roles to access and write contacts", () => {
    expect(canAccessContacts("tc")).toBe(true);
    expect(canWriteContacts("tc")).toBe(true);
    expect(canAccessContacts("admin")).toBe(true);
    expect(canWriteContacts("admin")).toBe(true);
  });

  it("disallows buyer role from contacts and credentials", () => {
    expect(canAccessContacts("buyer")).toBe(false);
    expect(canWriteContacts("buyer")).toBe(false);
    expect(canManageBrokerCredentials("buyer")).toBe(false);
  });

  it("restricts broker credential management to tenant/global admin", () => {
    expect(canManageBrokerCredentials("tenant_admin")).toBe(true);
    expect(canManageBrokerCredentials("global_admin")).toBe(true);
    expect(canManageBrokerCredentials("tc")).toBe(false);
  });
});
