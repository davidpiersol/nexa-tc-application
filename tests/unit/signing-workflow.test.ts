import { describe, expect, it } from "vitest";
import {
  SIGNING_PROVIDER_SLUG,
  resolveSigningWorkflowSlug,
} from "@/lib/signing/signing-workflow";

describe("resolveSigningWorkflowSlug", () => {
  it("maps DocuSign-like platform text", () => {
    const d = resolveSigningWorkflowSlug("DocuSign");
    expect(d.slug).toBe(SIGNING_PROVIDER_SLUG.docusignApi);
  });

  it("defaults neutral for empty or unrelated text", () => {
    expect(resolveSigningWorkflowSlug(null).slug).toBe(SIGNING_PROVIDER_SLUG.neutralManual);
    expect(resolveSigningWorkflowSlug("Choral Point").slug).toBe(
      SIGNING_PROVIDER_SLUG.neutralManual,
    );
  });
});
