import { describe, expect, it } from "vitest";
import { matchesArchiveView } from "@/lib/transactions/archive";
import {
  buildTransactionSearchText,
  matchesTransactionSearch,
} from "@/lib/transactions/search";

describe("transaction search helpers", () => {
  it("builds normalized searchable text from core + intake + party fields", () => {
    const text = buildTransactionSearchText({
      propertyAddress: "4821 Maple Ridge Dr",
      mlsNumber: "12345",
      notes: "Needs updated title docs",
      intakeData: { seller_broker_1_broker_name: "Sunset Realty" },
      partyText: "Jane Seller jane@example.com listing_agent",
    });
    expect(text).toContain("4821 maple ridge dr");
    expect(text).toContain("12345");
    expect(text).toContain("sunset realty");
    expect(text).toContain("jane seller");
  });

  it("matches query against party and intake data text", () => {
    const row = {
      propertyAddress: "100 Desert Willow",
      mlsNumber: "MLS-7",
      notes: "Urgent close timeline",
      intakeData: { buyer_broker_1_broker_name: "Blue Mesa Brokers" },
      partyText: "Client Contact client@example.com buyer",
    };
    expect(matchesTransactionSearch(row, "blue mesa")).toBe(true);
    expect(matchesTransactionSearch(row, "client@example.com")).toBe(true);
    expect(matchesTransactionSearch(row, "not-present")).toBe(false);
  });
});

describe("archive visibility helpers", () => {
  it("hides archived rows from default views", () => {
    expect(matchesArchiveView(null, "default")).toBe(true);
    expect(matchesArchiveView("2026-05-10T12:00:00Z", "default")).toBe(false);
  });

  it("shows archived rows in archive view", () => {
    expect(matchesArchiveView("2026-05-10T12:00:00Z", "archive")).toBe(true);
    expect(matchesArchiveView(null, "archive")).toBe(false);
  });
});
