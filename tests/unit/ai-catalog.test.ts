import { describe, expect, it } from "vitest";
import {
  AI_FEATURE_CATALOG,
  AI_PROVIDER_CATALOG,
  defaultAiFeatureSettings,
  estimateAiUsageCostCents,
} from "@/lib/ai/catalog";

describe("AI provider catalog", () => {
  it("supports major direct providers, gateways, and Groq", () => {
    const keys = AI_PROVIDER_CATALOG.map((provider) => provider.key);

    expect(keys).toEqual(
      expect.arrayContaining([
        "openai",
        "anthropic",
        "google_gemini",
        "google_vertex",
        "openrouter",
        "groq",
      ]),
    );
  });

  it("defines disabled-by-default settings for every AI feature", () => {
    const settings = defaultAiFeatureSettings();

    expect(settings).toHaveLength(AI_FEATURE_CATALOG.length);
    expect(settings.every((setting) => setting.enabled === false)).toBe(true);
    expect(settings.every((setting) => setting.maxOutputTokens > 0)).toBe(true);
    expect(
      settings.find((setting) => setting.featureKey === "template_mapping_suggestions")
        ?.requireExpensiveModelConfirmation,
    ).toBe(true);
  });

  it("estimates usage cost from per-million token prices when available", () => {
    expect(
      estimateAiUsageCostCents({
        inputTokens: 1_000_000,
        outputTokens: 500_000,
        inputPerMillionCents: 100,
        outputPerMillionCents: 400,
      }),
    ).toBe(300);
    expect(estimateAiUsageCostCents({ inputTokens: 10, outputTokens: 20 })).toBeNull();
  });
});
