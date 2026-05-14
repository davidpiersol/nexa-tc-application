import { CrmTouchEditPage } from "@/components/crm/crm-pages";

export default function AgentCrmTouchEditPage({ params }: { params: { id: string } }) {
  return <CrmTouchEditPage workspace="agent" id={params.id} />;
}
