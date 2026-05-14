import { CrmTaskDetailPage } from "@/components/crm/crm-pages";

export default function TcCrmTaskDetailPage({ params }: { params: { id: string } }) {
  return <CrmTaskDetailPage workspace="tc" id={params.id} />;
}
