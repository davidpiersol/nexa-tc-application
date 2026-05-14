import { CrmTaskDetailPage } from "@/components/crm/crm-pages";

export default function AgentCrmTaskDetailPage({ params }: { params: { id: string } }) {
  return <CrmTaskDetailPage workspace="agent" id={params.id} />;
}
