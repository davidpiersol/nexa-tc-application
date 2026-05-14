import type { BillingReminderItem, TcTaskRow } from "@/lib/queries/tc-dashboard";
import type { ScorecardSummary } from "@/lib/operations/scorecard";

export type OperationalNotificationSource = "ai" | "human" | "system" | "integration";
export type OperationalNotificationTone = "info" | "warning" | "urgent";

export type OperationalNotification = {
  id: string;
  title: string;
  body: string;
  source: OperationalNotificationSource;
  tone: OperationalNotificationTone;
  href?: string;
};

export type OperationalNotificationInput = {
  tasks: TcTaskRow[];
  billingReminders: BillingReminderItem[];
  scorecard: ScorecardSummary;
};

export function notificationSourceLabel(source: OperationalNotificationSource): string {
  switch (source) {
    case "ai":
      return "AI pass";
    case "human":
      return "Human pass";
    case "integration":
      return "Integration";
    case "system":
    default:
      return "System";
  }
}

export function buildOperationalNotifications(
  input: OperationalNotificationInput,
): OperationalNotification[] {
  const notifications: OperationalNotification[] = [];

  for (const reminder of input.billingReminders) {
    if (reminder.reminderStatus === "past_due" || reminder.reminderStatus === "due_now") {
      notifications.push({
        id: `billing-${reminder.id}`,
        title: reminder.reminderStatus === "past_due" ? "Past-due invoice" : "Invoice reminder due",
        body: `${reminder.invoiceNumber ?? "Invoice"} for ${reminder.brokerName ?? "client"} has ${reminder.balanceLabel} open. ${reminder.reminderLabel}.`,
        source: "system",
        tone: reminder.reminderStatus === "past_due" ? "urgent" : "warning",
        href: `/tc/billing/${reminder.id}`,
      });
    }
  }

  for (const task of input.tasks.filter((t) => !t.completed).slice(0, 3)) {
    notifications.push({
      id: `task-${task.id}`,
      title: "Open TC task",
      body: task.name,
      source: "human",
      tone: task.priority === "high" ? "urgent" : "info",
      href: `/tc/transactions/${task.transactionId}`,
    });
  }

  if (!input.scorecard.configured) {
    notifications.push({
      id: "scorecard-placeholder",
      title: "Scorecard setup blocked",
      body: input.scorecard.blocker,
      source: "system",
      tone: "warning",
      href: "/tc/scorecard",
    });
  }

  notifications.push({
    id: "activity-ai-human-lanes",
    title: "Activity labels ready",
    body: "Future automation reviews will show as AI pass events, while TC edits and reviews show as Human pass events.",
    source: "ai",
    tone: "info",
    href: "/tc/transactions",
  });

  return notifications.slice(0, 8);
}
