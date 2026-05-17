import { CrmTouchDetailPage } from "@/components/crm/crm-pages";

export default function TcCrmNoteDetailPage({ params }: { params: { id: string } }) {
  return <CrmTouchDetailPage workspace="tc" id={params.id} />;
}
