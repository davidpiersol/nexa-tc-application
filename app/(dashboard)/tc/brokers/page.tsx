import { ContactsConsole } from "@/components/tc/contacts-console";

export default function TcBrokersPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="font-display text-heading-lg text-brand-navy">Brokers</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Broker category contacts with signing preference/profile details.
        </p>
      </header>
      <ContactsConsole brokerOnly />
    </div>
  );
}
