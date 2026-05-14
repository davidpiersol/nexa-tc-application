import { CrmTouchEditPage } from "@/components/crm/crm-pages";

export default function AgentCrmNoteEditPage({ params }: { params: { id: string } }) {
  return <CrmTouchEditPage workspace="agent" id={params.id} noteOnly />;
}
