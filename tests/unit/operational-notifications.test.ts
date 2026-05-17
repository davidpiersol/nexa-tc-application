import { describe, expect, it } from "vitest";
import { buildOperationalNotifications } from "@/lib/operations/notifications";
import { buildScorecardPlaceholder } from "@/lib/operations/scorecard";

describe("operational notifications", () => {
  it("creates non-sending notification scaffolding from reminders, tasks, and scorecard blockers", () => {
    const notifications = buildOperationalNotifications({
      scorecard: buildScorecardPlaceholder(),
      tasks: [
        {
          id: "task-1",
          transactionId: "tx-1",
          name: "Review packet",
          completed: false,
          priority: "medium",
        },
      ],
      billingReminders: [
        {
          id: "invoice-1",
          invoiceNumber: "CP-1",
          brokerName: "Jody Broker",
          issueDate: "2026-05-14",
          dueDate: "2026-05-14",
          balanceLabel: "$100.00",
          reminderLabel: "Reminder due now",
          reminderStatus: "due_now",
        },
      ],
    });

    expect(notifications.map((item) => item.id)).toContain("billing-invoice-1");
    expect(notifications.map((item) => item.id)).toContain("task-task-1");
    expect(notifications.map((item) => item.id)).toContain("scorecard-placeholder");
    expect(notifications.find((item) => item.id === "activity-ai-human-lanes")?.source).toBe(
      "ai",
    );
  });
});
