import { MarketingPage } from "@/components/marketing/marketing-page";

export default function ResourcesPage() {
  return (
    <MarketingPage
      eyebrow="Resources"
      title="Guidance for teams that want cleaner operations."
      intro="The public resource library will grow over time. For now, it mirrors the strongest knowledge already inside the app: practical help, workflow guidance, and product education for teams adopting a more coherent operating rhythm."
      sections={[
        {
          title: "Help center",
          body: "Plain-language articles for dashboards, transactions, documents, First Pass, CRM, billing, reports, settings, and role-specific workflows.",
        },
        {
          title: "Workflow guides",
          body: "Step-by-step guidance for opening a transaction, reviewing documents, organizing contacts, and keeping the file moving cleanly toward closing.",
        },
        {
          title: "Release notes + playbooks",
          body: "A future home for product updates, onboarding checklists, operating playbooks, and implementation notes for teams standardizing their process.",
        },
      ]}
    />
  );
}
