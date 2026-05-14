import { describe, expect, it } from "vitest";
import {
  CRM_BOUNDARIES,
  CRM_PROVIDER_CATALOG,
  crmProviderCanBeEnabledWhenApproved,
  defaultCrmAdapterCapabilities,
} from "@/lib/crm/catalog";

describe("CRM catalog", () => {
  it("defines CRM boundaries without replacing contacts", () => {
    expect(CRM_BOUNDARIES).toEqual(
      expect.arrayContaining([
        "upcoming actions",
        "SOI categories and segmentation",
        "touch history",
        "follow-up tasks",
        "CSV and VCF import/export entry points",
      ]),
    );
  });

  it("keeps DeltaNET in investigation mode and lists approved candidates separately", () => {
    const delta = CRM_PROVIDER_CATALOG.find((provider) => provider.key === "deltanet");
    expect(delta?.status).toBe("investigate");
    expect(delta?.guardrail).toMatch(/official API access/i);

    expect(crmProviderCanBeEnabledWhenApproved("lofty")).toBe(true);
    expect(crmProviderCanBeEnabledWhenApproved("follow_up_boss")).toBe(true);
    expect(crmProviderCanBeEnabledWhenApproved("moxiworks")).toBe(true);
  });

  it("does not enable adapter operations by default", () => {
    const capabilities = defaultCrmAdapterCapabilities("lofty");

    expect(capabilities).toHaveLength(4);
    expect(capabilities.every((capability) => capability.enabled === false)).toBe(true);
    expect(capabilities.every((capability) => capability.reason.includes("disabled"))).toBe(true);
  });
});
