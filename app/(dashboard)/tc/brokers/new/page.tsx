import { ContactCreateForm } from "@/components/tc/contact-create-form";

export default function TcBrokersNewPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="font-display text-heading-lg text-brand-navy">Add Broker</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Create a broker contact with brokerage and signing preferences.
        </p>
      </header>
      <ContactCreateForm brokerMode />
    </div>
  );
}
