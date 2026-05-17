import { describe, expect, it } from "vitest";
import {
  SIGNING_DELIVERY_MODE,
  SIGNING_PROVIDER_SLUG,
  normalizeEnvelopeStatus,
  normalizeSigningDeliveryMode,
  isSigningProviderSlug,
  redactSigningCredentials,
  resolveSigningWorkflowSlug,
} from "@/lib/signing/signing-workflow";

describe("resolveSigningWorkflowSlug", () => {
  it("maps DocuSign-like platform text", () => {
    const d = resolveSigningWorkflowSlug("DocuSign");
    expect(d.slug).toBe(SIGNING_PROVIDER_SLUG.docusignApi);
  });

  it("maps provider-specific real estate platform text", () => {
    expect(resolveSigningWorkflowSlug("Adobe Acrobat Sign").slug).toBe(
      SIGNING_PROVIDER_SLUG.adobeApi,
    );
    expect(resolveSigningWorkflowSlug("DigiSign").slug).toBe(
      SIGNING_PROVIDER_SLUG.skyslopeDigiSignApi,
    );
    expect(resolveSigningWorkflowSlug("Dotloop").slug).toBe(
      SIGNING_PROVIDER_SLUG.dotloopApi,
    );
    expect(resolveSigningWorkflowSlug("Authentisign").slug).toBe(
      SIGNING_PROVIDER_SLUG.authentisignApi,
    );
    expect(resolveSigningWorkflowSlug("SkySlope").slug).toBe(
      SIGNING_PROVIDER_SLUG.skyslopeApi,
    );
  });

  it("defaults neutral for empty or unrelated text", () => {
    expect(resolveSigningWorkflowSlug(null).slug).toBe(SIGNING_PROVIDER_SLUG.neutralManual);
    expect(resolveSigningWorkflowSlug("Choral Point").slug).toBe(
      SIGNING_PROVIDER_SLUG.neutralManual,
    );
  });
});

describe("signing setup helpers", () => {
  it("normalizes delivery modes", () => {
    expect(normalizeSigningDeliveryMode("embedded signing")).toBe(SIGNING_DELIVERY_MODE.embedded);
    expect(normalizeSigningDeliveryMode("broker portal")).toBe(
      SIGNING_DELIVERY_MODE.providerPortal,
    );
    expect(normalizeSigningDeliveryMode("manual export")).toBe(
      SIGNING_DELIVERY_MODE.manualExport,
    );
    expect(normalizeSigningDeliveryMode(null)).toBe(SIGNING_DELIVERY_MODE.emailLink);
  });

  it("maps provider statuses into Choral Point statuses", () => {
    expect(normalizeEnvelopeStatus("created")).toBe("draft");
    expect(normalizeEnvelopeStatus("sent")).toBe("sent");
    expect(normalizeEnvelopeStatus("delivered")).toBe("delivered");
    expect(normalizeEnvelopeStatus("completed")).toBe("completed");
    expect(normalizeEnvelopeStatus("declined")).toBe("declined");
    expect(normalizeEnvelopeStatus("voided")).toBe("voided");
    expect(normalizeEnvelopeStatus("http_error")).toBe("failed");
  });

  it("redacts likely secret credential values", () => {
    expect(
      redactSigningCredentials({
        integrationKey: "abc",
        accountId: "acct",
        accessToken: "secret",
      }),
    ).toEqual({
      integrationKey: "[stored]",
      accountId: "acct",
      accessToken: "[stored]",
    });
  });

  it("checks provider slugs before provider-label lookup", () => {
    expect(isSigningProviderSlug("docusign_api")).toBe(true);
    expect(isSigningProviderSlug("not_a_provider")).toBe(false);
    expect(isSigningProviderSlug(null)).toBe(false);
  });
});
