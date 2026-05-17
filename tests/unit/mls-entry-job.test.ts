import { describe, expect, it } from "vitest";
import {
  formatMlsEntryBillingStatus,
  formatMlsEntryJobStatus,
  normalizeMlsEntryBillingStatus,
  normalizeMlsEntryJobInput,
  normalizeMlsEntryJobStatus,
} from "@/lib/mls/mls-entry-job";

describe("MLS entry job helpers", () => {
  it("normalizes text, status, billing status, and list price", () => {
    expect(
      normalizeMlsEntryJobInput({
        requesting_broker_name: "  Angela  ",
        property_address: "  123 Mesa Rd  ",
        list_price: "$415,000",
        status: "submitted",
        billing_status: "ready_to_invoice",
      }),
    ).toMatchObject({
      requesting_broker_name: "Angela",
      property_address: "123 Mesa Rd",
      list_price: 415000,
      status: "submitted",
      billing_status: "ready_to_invoice",
    });
  });

  it("falls back to safe default statuses and ignores invalid prices", () => {
    expect(normalizeMlsEntryJobStatus("bad")).toBe("draft");
    expect(normalizeMlsEntryBillingStatus("bad")).toBe("not_invoiced");
    expect(
      normalizeMlsEntryJobInput({
        requesting_broker_name: "",
        property_address: "456 Rio Dr",
        list_price: "-1",
        status: "bad",
        billing_status: "bad",
      }),
    ).toMatchObject({
      requesting_broker_name: null,
      property_address: "456 Rio Dr",
      list_price: null,
      status: "draft",
      billing_status: "not_invoiced",
    });
  });

  it("formats job and billing statuses for cards", () => {
    expect(formatMlsEntryJobStatus("ready_for_entry")).toBe("Ready for MLS entry");
    expect(formatMlsEntryBillingStatus("paid")).toBe("Paid");
  });
});
