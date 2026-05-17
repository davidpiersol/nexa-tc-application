import { CrmTaskEditPage } from "@/components/crm/crm-pages";

export default function TcCrmTaskEditPage({ params }: { params: { id: string } }) {
  return <CrmTaskEditPage workspace="tc" id={params.id} kind="follow_up" />;
}
