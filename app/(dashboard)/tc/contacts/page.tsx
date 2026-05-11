import { ContactsConsole } from "@/components/tc/contacts-console";

export default function TcContactsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="font-display text-heading-lg text-brand-navy">Contacts</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Shared contact directory across transactions.
        </p>
      </header>
      <ContactsConsole />
    </div>
  );
}
