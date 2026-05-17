import { MarketingPage } from "@/components/marketing/marketing-page";

export default function PlatformPage() {
  return (
    <MarketingPage
      eyebrow="Platform"
      title="One operating center for the full life of a deal."
      intro="Choral Point brings transaction intake, First Pass review, documents, participants, tasks, CRM follow-up, billing, and reporting into one calm workspace so teams can work from the same version of the story."
      sections={[
        {
          title: "Transaction workspace",
          body: "Open files, track milestones, manage parties, and move from intake through closing without rebuilding context from inboxes and spreadsheets.",
        },
        {
          title: "Documents + First Pass",
          body: "Upload source files, generate documents, review AI-assisted extraction, preserve human approval, and keep signing readiness close to the transaction.",
        },
        {
          title: "Operations layer",
          body: "Coordinate CRM touchpoints, billing, invoices, reports, scorecards, and admin controls from the same product family instead of stitching together side systems.",
        },
      ]}
    />
  );
}
