import { CrmRelationshipDetailPage } from "@/components/crm/crm-pages";

export default function TcCrmRelationshipDetailPage({ params }: { params: { id: string } }) {
  return <CrmRelationshipDetailPage workspace="tc" id={params.id} />;
}
