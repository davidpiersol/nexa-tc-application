export const CONTACT_CATEGORIES = [
  "attorney",
  "broker",
  "buyer",
  "client",
  "lead",
  "lender",
  "seller",
  "soi",
  "tc",
  "title",
  "vendor",
  "other",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export function isContactCategory(value: string): value is ContactCategory {
  return (CONTACT_CATEGORIES as readonly string[]).includes(value);
}

export function normalizeContactCategories(values: string[] | undefined): ContactCategory[] {
  if (!values?.length) return [];
  const seen = new Set<ContactCategory>();
  for (const value of values) {
    if (isContactCategory(value)) seen.add(value);
  }
  return [...seen];
}

const CATEGORY_LABELS: Record<ContactCategory, string> = {
  attorney: "Attorney",
  broker: "Broker",
  buyer: "Buyer",
  client: "Client",
  lead: "Lead",
  lender: "Lender",
  seller: "Seller",
  soi: "SOI",
  tc: "TC",
  title: "Title",
  vendor: "Vendor",
  other: "Other",
};

export function contactCategoryLabel(category: ContactCategory): string {
  return CATEGORY_LABELS[category];
}

export function sortedContactCategoriesForUi(): ContactCategory[] {
  const base = CONTACT_CATEGORIES.filter(
    (category): category is Exclude<ContactCategory, "other"> => category !== "other",
  );
  const sorted = [...base].sort((a, b) =>
    contactCategoryLabel(a).localeCompare(contactCategoryLabel(b)),
  );
  return [...sorted, "other"];
}
