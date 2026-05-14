import { CrmRelationshipDetailPage } from "@/components/crm/crm-pages";

export default function AgentCrmRelationshipDetailPage({ params }: { params: { id: string } }) {
  return <CrmRelationshipDetailPage workspace="agent" id={params.id} />;
}
