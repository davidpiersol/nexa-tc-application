import { describe, expect, it } from "vitest";
import { mergeApprovedSuggestionMappings } from "@/lib/documents/merge-mapping-suggestion";

describe("mergeApprovedSuggestionMappings", () => {
  it("uses edited mappings when provided (admin review)", () => {
    const merged = mergeApprovedSuggestionMappings(
      { A: "property_address" },
      { A: "mls_number" },
    );
    expect(merged).toEqual({ A: "mls_number" });
  });

  it("falls back to AI suggestion when no edits", () => {
    expect(
      mergeApprovedSuggestionMappings({ Field1: "buyers_names", Field2: "close_date" }),
    ).toEqual({ Field1: "buyers_names", Field2: "close_date" });
  });
});
