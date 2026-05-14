import { describe, expect, it } from "vitest";
import { canUseCrm } from "@/lib/crm/api";
import { crmRelationshipSchema, crmTaskSchema, crmTouchpointSchema } from "@/lib/crm/validation";

describe("CRM validation and permissions", () => {
  it("allows TC, admin, tenant admin, broker, and agent CRM access", () => {
    expect(canUseCrm("tc")).toBe(true);
    expect(canUseCrm("admin")).toBe(true);
    expect(canUseCrm("tenant_admin")).toBe(true);
    expect(canUseCrm("broker")).toBe(true);
    expect(canUseCrm("agent")).toBe(true);
    expect(canUseCrm("buyer")).toBe(false);
  });

  it("validates tasks and reminders", () => {
    expect(
      crmTaskSchema.safeParse({
        kind: "reminder",
        title: "Call Jody",
        priority: "high",
        status: "open",
        segment: "broker_client",
      }).success,
    ).toBe(true);
    expect(crmTaskSchema.safeParse({ title: "" }).success).toBe(false);
    expect(crmTaskSchema.safeParse({ title: "Bad", priority: "urgent" }).success).toBe(false);
  });

  it("requires touchpoints and relationships to link valid contact ids", () => {
    const contactId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    expect(
      crmTouchpointSchema.safeParse({
        contactId,
        touchType: "call",
        direction: "outbound",
      }).success,
    ).toBe(true);
    expect(crmTouchpointSchema.safeParse({ touchType: "note" }).success).toBe(false);
    expect(
      crmRelationshipSchema.safeParse({
        primaryContactId: contactId,
        relationshipType: "referral_source",
      }).success,
    ).toBe(true);
  });
});
