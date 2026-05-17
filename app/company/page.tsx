import { MarketingPage } from "@/components/marketing/marketing-page";

export default function CompanyPage() {
  return (
    <MarketingPage
      eyebrow="Company"
      title="Built around clarity, coordination, and trust."
      intro="Choral Point is being built for teams that want automation to reduce friction without removing the human judgment that real estate still depends on."
      sections={[
        {
          title: "Mission",
          body: "Create a shared center where every participant can move with better context, fewer preventable surprises, and a cleaner record of the work.",
        },
        {
          title: "Principles",
          body: "Keep humans in the loop, protect tenant boundaries, prefer explainable workflows, and make the next action easier to see than the noise around it.",
        },
        {
          title: "Contact",
          body: "Prospective brokerages, transaction teams, and early partners can begin through the information-request flow and shape what comes next.",
        },
      ]}
    />
  );
}
