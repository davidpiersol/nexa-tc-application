import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_MAX_GENERATION_TEMPLATE_BYTES,
  maxGenerationTemplateBytes,
} from "@/lib/documents/pdf-generation-limits";

describe("maxGenerationTemplateBytes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses default when unset", () => {
    expect(maxGenerationTemplateBytes()).toBe(DEFAULT_MAX_GENERATION_TEMPLATE_BYTES);
  });

  it("reads NEXA_MAX_GENERATION_TEMPLATE_MB when valid", () => {
    vi.stubEnv("NEXA_MAX_GENERATION_TEMPLATE_MB", "25");
    expect(maxGenerationTemplateBytes()).toBe(25 * 1024 * 1024);
  });

  it("ignores invalid env values", () => {
    vi.stubEnv("NEXA_MAX_GENERATION_TEMPLATE_MB", "not-a-number");
    expect(maxGenerationTemplateBytes()).toBe(DEFAULT_MAX_GENERATION_TEMPLATE_BYTES);
    vi.stubEnv("NEXA_MAX_GENERATION_TEMPLATE_MB", "200");
    expect(maxGenerationTemplateBytes()).toBe(DEFAULT_MAX_GENERATION_TEMPLATE_BYTES);
  });
});
