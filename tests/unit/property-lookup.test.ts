import { describe, expect, it } from "vitest";
import { extractManualPropertySuggestions } from "@/lib/property-lookup/manual-extract";
import { missingPropertyFields } from "@/lib/property-lookup/registry";

describe("property lookup manual fallback", () => {
  it("extracts labeled manual fields but still requires confirmation", () => {
    const rows = extractManualPropertySuggestions("Owner: Jane Doe\nParcel number: 123-ABC\nLegal description: Lot 4\nCounty: Valencia");
    expect(rows.map((row) => row.fieldKey)).toEqual(["owner_name", "parcel_number", "property_legal_description", "county"]);
    expect(rows.every((row) => row.confidence === 70)).toBe(true);
  });
  it("reports missing canonical fields", () => {
    expect(missingPropertyFields({ county: "Valencia", parcel_number: "123" })).toContain("owner_name");
  });
});
