import { CrmTouchEditPage } from "@/components/crm/crm-pages";

export default function TcCrmTouchEditPage({ params }: { params: { id: string } }) {
  return <CrmTouchEditPage workspace="tc" id={params.id} />;
}
