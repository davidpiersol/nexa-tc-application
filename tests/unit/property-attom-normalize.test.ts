import { describe, expect, it } from "vitest";
import { normalizeAttomSuggestions } from "@/lib/property-lookup/attom-normalize";

describe("attom normalization", () => {
  it("maps known fields conservatively", () => {
    const suggestions = normalizeAttomSuggestions({ property: [{ address: { oneLine: "1 Main St" }, identifier: { apn: "A-1" }, owner: { owner1: "Jane" }, lot: { lotSize1: 2.5 }, assessment: { assessed: 120000 } }] });
    expect(suggestions.map((item) => item.fieldKey)).toEqual(["property_address", "parcel_number", "owner_name", "acreage", "assessed_value"]);
  });
});
