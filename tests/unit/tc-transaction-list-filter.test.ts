import { describe, expect, it } from "vitest";
import {
  parseTcTransactionListFilter,
  tcTransactionListFilterTitle,
  tcTransactionListHref,
  isTcTransactionListFilter,
} from "@/lib/tc-transaction-list-filter";
import {
  formatTransactionStatusLabel,
  formatTransactionNextLabel,
  deriveOverviewFromIntake,
} from "@/lib/queries/tc-transactions-list";

describe("tc-transaction-list-filter", () => {
  it("parses filter from searchParams-style values", () => {
    expect(parseTcTransactionListFilter("active")).toBe("active");
    expect(parseTcTransactionListFilter(["due-week"])).toBe("due-week");
    expect(parseTcTransactionListFilter(undefined)).toBeUndefined();
    expect(parseTcTransactionListFilter("not-a-filter")).toBeUndefined();
  });

  it("validates known filter keys", () => {
    expect(isTcTransactionListFilter("pending-reviews")).toBe(true);
    expect(isTcTransactionListFilter("signatures")).toBe(true);
    expect(isTcTransactionListFilter("")).toBe(false);
  });

  it("titles match KPI labels", () => {
    expect(tcTransactionListFilterTitle("active")).toBe("Active transactions");
    expect(tcTransactionListFilterTitle("due-week")).toBe("Due this week");
    expect(tcTransactionListFilterTitle(undefined)).toBeUndefined();
  });

  it("builds stable transaction list URLs", () => {
    expect(tcTransactionListHref("signatures")).toBe("/tc/transactions?filter=signatures");
  });
});

describe("tc-transactions-list format helpers", () => {
  it("formats status enum for display", () => {
    expect(formatTransactionStatusLabel("under_contract")).toBe("under contract");
  });

  it("formats close date or TBD", () => {
    expect(formatTransactionNextLabel(null)).toBe("TBD");
    const formatted = formatTransactionNextLabel("2026-04-20");
    expect(formatted).not.toBe("TBD");
    expect(formatted).toMatch(/\d/);
  });

  it("derives overview labels from intake_data", () => {
    const overview = deriveOverviewFromIntake({
      property_legal_description: "Lot 12 Block 4",
      tc_representation_side: "both",
      seller_broker_1_broker_name: "Seller Broker",
      buyer_broker_1_brokerage_firm: "Buyer Firm",
    });
    expect(overview.legalDescription).toBe("Lot 12 Block 4");
    expect(overview.representationSide).toBe("both");
    expect(overview.sellerBrokerName).toBe("Seller Broker");
    expect(overview.buyerBrokerName).toBe("Buyer Firm");
  });
});
