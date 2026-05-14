import { CrmTaskEditPage } from "@/components/crm/crm-pages";

export default function AgentCrmTaskEditPage({ params }: { params: { id: string } }) {
  return <CrmTaskEditPage workspace="agent" id={params.id} kind="follow_up" />;
}
