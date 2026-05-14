import { CrmRelationshipEditPage } from "@/components/crm/crm-pages";

export default function TcCrmRelationshipEditPage({ params }: { params: { id: string } }) {
  return <CrmRelationshipEditPage workspace="tc" id={params.id} />;
}
