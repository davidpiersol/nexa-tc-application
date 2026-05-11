import {
  contactCategoryLabel,
  type ContactCategory,
  isContactCategory,
} from "@/lib/contacts/categories";

export const TRANSACTION_CONTACT_ROLES = [
  "vendor",
  "lender",
  "title",
  "attorney",
  "broker",
  "other",
] as const;

export type TransactionContactRole = (typeof TRANSACTION_CONTACT_ROLES)[number];

const ROLE_LABELS: Record<TransactionContactRole, string> = {
  vendor: "Vendor",
  lender: "Lender",
  title: "Title",
  attorney: "Attorney",
  broker: "Broker",
  other: "Other",
};

export function isTransactionContactRole(value: string): value is TransactionContactRole {
  return (TRANSACTION_CONTACT_ROLES as readonly string[]).includes(value);
}

export function transactionContactRoleLabel(role: TransactionContactRole): string {
  return ROLE_LABELS[role];
}

export function normalizeAssignmentCategory(value: unknown): ContactCategory | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return isContactCategory(trimmed) ? trimmed : null;
}

export function assignmentCategoryLabel(category: ContactCategory | null): string {
  return category ? contactCategoryLabel(category) : "Unspecified";
}
