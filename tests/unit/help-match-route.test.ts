import { describe, expect, it } from "vitest";
import { resolveHelpSlugForPath } from "@/lib/help/match-route";

describe("resolveHelpSlugForPath", () => {
  it("returns page-specific transaction help", () => {
    expect(resolveHelpSlugForPath("/tc/transactions/tx-1/documents")).toBe("tc-document-manager");
    expect(resolveHelpSlugForPath("/tc/transactions/tx-1/documents/doc-1")).toBe("tc-document-manager");
    expect(resolveHelpSlugForPath("/tc/transactions/tx-1/first-pass")).toBe("tc-checklists");
    expect(resolveHelpSlugForPath("/tc/transactions/tx-1/vendors")).toBe("tc-assign-vendors");
    expect(resolveHelpSlugForPath("/tc/transactions/tx-1/parties/party-1")).toBe("tc-inviting-parties");
  });

  it("returns page-specific CRM help", () => {
    expect(resolveHelpSlugForPath("/tc/contacts")).toBe("tc-contacts-directory");
    expect(resolveHelpSlugForPath("/tc/contacts/new")).toBe("tc-contacts-directory");
    expect(resolveHelpSlugForPath("/tc/contacts/contact-1")).toBe("tc-contact-delete-impact-check");
    expect(resolveHelpSlugForPath("/tc/brokers/broker-1")).toBe("tc-broker-profiles");
    expect(resolveHelpSlugForPath("/tc/crm/tasks")).toBe("tc-crm");
    expect(resolveHelpSlugForPath("/agent/crm/connections")).toBe("agent-crm");
  });

  it("returns page-specific help for newer TC workspaces", () => {
    expect(resolveHelpSlugForPath("/tc/mls-entry/new")).toBe("tc-mls-entry");
    expect(resolveHelpSlugForPath("/tc/billing/invoices")).toBe("tc-billing-and-invoices");
    expect(resolveHelpSlugForPath("/tc/reports/billing")).toBe("tc-reports");
  });

  it("returns page-specific global admin help", () => {
    expect(resolveHelpSlugForPath("/admin/global")).toBe("global-admin-overview");
    expect(resolveHelpSlugForPath("/admin/global/dashboard")).toBe("global-admin-overview");
    expect(resolveHelpSlugForPath("/admin/global/reports")).toBe("global-admin-overview");
    expect(resolveHelpSlugForPath("/admin/global/tenants")).toBe("global-admin-tenants");
    expect(resolveHelpSlugForPath("/admin/global/wiki")).toBe("global-admin-wiki");
  });

  it("maps broker hub routes to agent dashboard help", () => {
    expect(resolveHelpSlugForPath("/agent")).toBe("agent-dashboard-overview");
    expect(resolveHelpSlugForPath("/agent/profile")).toBe("agent-dashboard-overview");
    expect(resolveHelpSlugForPath("/agent/tx-1/documents")).toBe("agent-uploading-documents");
    expect(resolveHelpSlugForPath("/agent/tx-1/messages")).toBe("agent-messaging");
  });

  it("falls back to workspace guide for unknown pages", () => {
    expect(resolveHelpSlugForPath("/unknown")).toBe("workspace-overview");
  });
});
