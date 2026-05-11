import { ContactDetailConsole } from "@/components/tc/contact-detail-console";

type Props = {
  params: {
    id: string;
  };
};

export default function TcContactDetailPage({ params }: Props) {
  return <ContactDetailConsole contactId={params.id} brokerMode={false} />;
}
