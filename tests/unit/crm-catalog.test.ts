import { describe, expect, it } from "vitest";
import {
  CRM_LITE_BOUNDARIES,
  CRM_PROVIDER_CATALOG,
  defaultCrmAdapterCapabilities,
  externalCrmSyncEnabled,
} from "@/lib/crm/catalog";

describe("CRM catalog", () => {
  it("defines CRM-lite boundaries without replacing contacts", () => {
    expect(CRM_LITE_BOUNDARIES).toEqual(
      expect.arrayContaining([
        "contacts",
        "SOI categories and segmentation",
        "touch history",
        "follow-up tasks",
        "import/export",
      ]),
    );
  });

  it("keeps DeltaNET in investigation mode and lists approved candidates separately", () => {
    const delta = CRM_PROVIDER_CATALOG.find((provider) => provider.key === "deltanet");
    expect(delta?.status).toBe("investigate");
    expect(delta?.guardrail).toMatch(/official API access/i);

    expect(externalCrmSyncEnabled("lofty")).toBe(true);
    expect(externalCrmSyncEnabled("follow_up_boss")).toBe(true);
    expect(externalCrmSyncEnabled("moxiworks")).toBe(true);
  });

  it("does not enable adapter operations by default", () => {
    const capabilities = defaultCrmAdapterCapabilities("lofty");

    expect(capabilities).toHaveLength(4);
    expect(capabilities.every((capability) => capability.enabled === false)).toBe(true);
    expect(capabilities.every((capability) => capability.reason.includes("disabled"))).toBe(true);
  });
});
