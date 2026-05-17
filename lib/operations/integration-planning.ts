export type CommunicationProviderPlan = {
  id: string;
  name: string;
  status: "optional_scaffold" | "later_provider_integration";
  scope: "tenant" | "user" | "provider";
  summary: string;
};

export const COMMUNICATION_PROVIDER_PLANS: CommunicationProviderPlan[] = [
  {
    id: "slack",
    name: "Slack",
    status: "optional_scaffold",
    scope: "provider",
    summary:
      "Optional provider-scoped messaging target for team channels, transaction channels, and direct notifications once a tenant chooses Slack.",
  },
  {
    id: "microsoft-outlook",
    name: "Microsoft Outlook / Calendar",
    status: "later_provider_integration",
    scope: "user",
    summary:
      "Later OAuth/provider integration for calendar reminders and email handoff after credentials, mailbox ownership, and organization model are confirmed.",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    status: "later_provider_integration",
    scope: "user",
    summary:
      "Later OAuth/provider integration for users who operate from Google Workspace or Gmail calendars.",
  },
];

export function providerPlanStatusLabel(status: CommunicationProviderPlan["status"]): string {
  return status === "optional_scaffold" ? "Optional scaffold" : "Later integration";
}
