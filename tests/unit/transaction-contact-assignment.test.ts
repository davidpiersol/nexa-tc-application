import { describe, expect, it } from "vitest";
import {
  assignmentCategoryLabel,
  isTransactionContactRole,
  normalizeAssignmentCategory,
  transactionContactRoleLabel,
} from "@/lib/transactions/contact-assignment";

describe("transaction contact assignment helpers", () => {
  it("validates transaction contact roles", () => {
    expect(isTransactionContactRole("vendor")).toBe(true);
    expect(isTransactionContactRole("lender")).toBe(true);
    expect(isTransactionContactRole("random")).toBe(false);
  });

  it("normalizes assignment category values", () => {
    expect(normalizeAssignmentCategory(" vendor ")).toBe("vendor");
    expect(normalizeAssignmentCategory("BROKER")).toBe("broker");
    expect(normalizeAssignmentCategory("unknown")).toBeNull();
  });

  it("provides readable labels", () => {
    expect(transactionContactRoleLabel("title")).toBe("Title");
    expect(assignmentCategoryLabel("attorney")).toBe("Attorney");
    expect(assignmentCategoryLabel(null)).toBe("Unspecified");
  });
});
