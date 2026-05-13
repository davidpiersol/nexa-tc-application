import { describe, expect, it } from "vitest";
import { parseAiMappingPayload } from "@/lib/documents/ai-mapping-suggestion";

describe("parseAiMappingPayload", () => {
  it("extracts mappings, confidence, and rationale", () => {
    const payload = parseAiMappingPayload({
      mappings: { BuyerField: "buyers_names", Addr: "property_address" },
      confidence: 0.72,
      rationale: "Matched labels",
    });
    expect(payload).not.toBeNull();
    expect(payload!.confidence).toBe(0.72);
    expect(payload!.rationale).toBe("Matched labels");
    expect(payload!.mappings.BuyerField).toBe("buyers_names");
  });

  it("returns null for invalid shapes", () => {
    expect(parseAiMappingPayload(null)).toBeNull();
    expect(parseAiMappingPayload({ mappings: "no" })).toBeNull();
    expect(parseAiMappingPayload({})).toBeNull();
  });

  it("clamps confidence into 0..1", () => {
    const hi = parseAiMappingPayload({ mappings: {}, confidence: 2 });
    expect(hi!.confidence).toBe(1);
    const lo = parseAiMappingPayload({ mappings: {}, confidence: -1 });
    expect(lo!.confidence).toBe(0);
  });
});
