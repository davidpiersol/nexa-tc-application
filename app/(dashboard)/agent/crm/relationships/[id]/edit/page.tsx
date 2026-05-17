import { CrmRelationshipEditPage } from "@/components/crm/crm-pages";

export default function AgentCrmRelationshipEditPage({ params }: { params: { id: string } }) {
  return <CrmRelationshipEditPage workspace="agent" id={params.id} />;
}
