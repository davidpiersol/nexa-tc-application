import { CrmTouchDetailPage } from "@/components/crm/crm-pages";

export default function TcCrmTouchDetailPage({ params }: { params: { id: string } }) {
  return <CrmTouchDetailPage workspace="tc" id={params.id} />;
}
