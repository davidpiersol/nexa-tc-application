import { MarketingPage } from "@/components/marketing/marketing-page";

export default function HowItWorksPage() {
  return (
    <MarketingPage
      eyebrow="How it works"
      title="Connect the people, the paperwork, and the next move."
      intro="Choral Point follows the natural rhythm of a file: open the transaction, surface what matters, coordinate the work, and preserve a cleaner path to closing."
      sections={[
        {
          title: "1. Open the deal",
          body: "Create the transaction, capture identifiers, add the right parties, and begin from a structured intake instead of a loose collection of emails.",
        },
        {
          title: "2. Review and coordinate",
          body: "Use documents, First Pass, tasks, milestones, CRM follow-up, and signing preferences to keep each participant aligned around the same file.",
        },
        {
          title: "3. Close with context",
          body: "Track progress, billing, reports, and historical activity so the closing is not just complete, but legible to the people who inherit the record.",
        },
      ]}
    />
  );
}
