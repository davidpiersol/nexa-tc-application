import { CrmTouchDetailPage } from "@/components/crm/crm-pages";

export default function AgentCrmNoteDetailPage({ params }: { params: { id: string } }) {
  return <CrmTouchDetailPage workspace="agent" id={params.id} />;
}
