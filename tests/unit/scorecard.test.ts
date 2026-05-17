import { describe, expect, it } from "vitest";
import {
  buildScorecardPlaceholder,
  SCORECARD_PLACEHOLDER_BLOCKER,
} from "@/lib/operations/scorecard";

describe("scorecard placeholder", () => {
  it("keeps P27 scorecard blocked until rules are supplied", () => {
    const scorecard = buildScorecardPlaceholder();

    expect(scorecard.configured).toBe(false);
    expect(scorecard.percent).toBe(0);
    expect(scorecard.blocker).toBe(SCORECARD_PLACEHOLDER_BLOCKER);
    expect(scorecard.metrics.length).toBeGreaterThanOrEqual(5);
  });

  it("caps completed scorecard work at target values", () => {
    const scorecard = buildScorecardPlaceholder([
      {
        id: "daily",
        label: "Daily work",
        cadence: "daily",
        target: 5,
        completed: 9,
        unit: "items",
      },
    ]);

    expect(scorecard.completed).toBe(5);
    expect(scorecard.total).toBe(5);
    expect(scorecard.percent).toBe(100);
  });
});
