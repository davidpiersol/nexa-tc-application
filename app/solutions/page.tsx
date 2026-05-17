import { MarketingPage } from "@/components/marketing/marketing-page";

export default function SolutionsPage() {
  return (
    <MarketingPage
      eyebrow="Solutions"
      title="Purpose-built for the people who move deals forward."
      intro="Choral Point is shaped around the actual work of a real-estate operation: transaction coordination, agent follow-up, brokerage visibility, and clean handoffs for every participant around the file."
      sections={[
        {
          title: "For transaction coordinators",
          body: "Manage active files, documents, deadlines, First Pass review, MLS-only jobs, contacts, invoices, and daily priorities from one command center.",
        },
        {
          title: "For agents",
          body: "Stay connected to deal status, CRM tasks, reminders, touch history, relationships, and the next client action without losing the thread.",
        },
        {
          title: "For brokerages",
          body: "Create consistency across admins, teams, templates, reporting, compliance boundaries, and future integrations while keeping role-based access intact.",
        },
      ]}
    />
  );
}
