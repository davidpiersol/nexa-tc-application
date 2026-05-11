import { ContactCreateForm } from "@/components/tc/contact-create-form";

export default function TcContactsNewPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="font-display text-heading-lg text-brand-navy">Add Contacts</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Create a contact profile for CRM, intake lookup, and reporting.
        </p>
      </header>
      <ContactCreateForm />
    </div>
  );
}
