import { describe, expect, it } from "vitest";
import {
  isTemplateAvailabilityState,
  isTemplateSelectionState,
  templateAvailabilityLabel,
  templateSelectionStateLabel,
} from "@/lib/documents/template-selection";

describe("template-selection helpers", () => {
  it("validates selection and availability states", () => {
    expect(isTemplateSelectionState("required")).toBe(true);
    expect(isTemplateSelectionState("pending_licensed_copy")).toBe(true);
    expect(isTemplateSelectionState("nope")).toBe(false);

    expect(isTemplateAvailabilityState("available")).toBe(true);
    expect(isTemplateAvailabilityState("unavailable")).toBe(true);
    expect(isTemplateAvailabilityState("other")).toBe(false);
  });

  it("formats labels for checklist display", () => {
    expect(templateSelectionStateLabel("pending_licensed_copy")).toBe(
      "Pending licensed copy",
    );
    expect(templateSelectionStateLabel("default")).toBe("Default");
    expect(templateAvailabilityLabel("available")).toBe("Available");
    expect(templateAvailabilityLabel("pending_licensed_copy")).toBe(
      "Pending licensed copy",
    );
  });
});
