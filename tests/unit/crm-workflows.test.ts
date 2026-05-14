import { describe, expect, it } from "vitest";
import { bucketCrmActions, crmDateInputValue, crmStatusLabel } from "@/lib/crm/workflows";

describe("CRM workflows", () => {
  it("buckets open actions by due date", () => {
    const now = new Date("2026-05-14T10:00:00-06:00");
    const buckets = bucketCrmActions(
      [
        { id: "1", title: "Overdue", dueAt: "2026-05-13T18:00:00-06:00", status: "open" },
        { id: "2", title: "Today", dueAt: "2026-05-14T12:00:00-06:00", status: "open" },
        { id: "3", title: "Completed", dueAt: "2026-05-14T12:00:00-06:00", status: "completed" },
        { id: "4", title: "Later", dueAt: null, status: "open" },
      ],
      now,
    );

    expect(buckets.overdue.map((item) => item.id)).toEqual(["1"]);
    expect(buckets.today.map((item) => item.id)).toEqual(["2"]);
    expect(buckets.completed.map((item) => item.id)).toEqual(["3"]);
    expect(buckets.later.map((item) => item.id)).toEqual(["4"]);
  });

  it("formats labels and local datetime inputs", () => {
    expect(crmStatusLabel("broker_client")).toBe("Broker Client");
    expect(crmDateInputValue("2026-05-14T12:30:00.000Z")).toMatch(/^2026-05-14T/);
  });
});
