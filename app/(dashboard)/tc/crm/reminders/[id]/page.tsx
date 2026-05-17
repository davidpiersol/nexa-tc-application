import { CrmTaskDetailPage } from "@/components/crm/crm-pages";

export default function TcCrmReminderDetailPage({ params }: { params: { id: string } }) {
  return <CrmTaskDetailPage workspace="tc" id={params.id} />;
}
