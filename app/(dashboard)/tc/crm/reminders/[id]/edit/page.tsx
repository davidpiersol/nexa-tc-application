import { CrmTaskEditPage } from "@/components/crm/crm-pages";

export default function TcCrmReminderEditPage({ params }: { params: { id: string } }) {
  return <CrmTaskEditPage workspace="tc" id={params.id} kind="reminder" />;
}
