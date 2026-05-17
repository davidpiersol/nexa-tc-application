import { CrmTaskEditPage } from "@/components/crm/crm-pages";

export default function AgentCrmReminderEditPage({ params }: { params: { id: string } }) {
  return <CrmTaskEditPage workspace="agent" id={params.id} kind="reminder" />;
}
