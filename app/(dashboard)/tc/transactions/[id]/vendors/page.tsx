import { notFound } from "next/navigation";
import { TransactionContactAssignmentsClient } from "@/components/tc/transaction-contact-assignments-client";
import { getTransactionDetail } from "@/lib/queries/transaction-detail";
import { getContactLookupOptions } from "@/lib/queries/contacts";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { loadActorContext } from "@/lib/auth/actor-context";

type Props = {
  params: {
    id: string;
  };
};

export default async function TransactionVendorsPage({ params }: Props) {
  const [tx, actor, contactOptions] = await Promise.all([
    getTransactionDetail(params.id),
    loadActorContext(),
    getContactLookupOptions(),
  ]);
  if (!tx || !actor) notFound();

  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("transaction_contact_assignments")
    .select(
      "id, transaction_id, contact_id, assignment_role, assignment_category, notes, contacts(id, full_name, email, phone, company)",
    )
    .eq("tenant_id", actor.tenantId)
    .eq("transaction_id", params.id)
    .order("created_at", { ascending: true });

  const assignments = (data ?? []).map((row) => {
    const contact = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts;
    return {
      id: row.id,
      transactionId: row.transaction_id,
      contactId: row.contact_id,
      assignmentRole: row.assignment_role,
      assignmentCategory: row.assignment_category,
      notes: row.notes,
      contact: contact
        ? {
            id: contact.id,
            fullName: contact.full_name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
          }
        : null,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Transaction · {tx.mls_number ? `MLS #${tx.mls_number}` : tx.id}
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">Assign Vendors</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Reuse existing contacts as transaction service providers without duplicating profile records.
        </p>
      </header>

      <TransactionContactAssignmentsClient
        transactionId={params.id}
        initialAssignments={assignments}
        contactOptions={contactOptions.map((contact) => ({
          id: contact.id,
          fullName: contact.fullName,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          categories: contact.categories,
        }))}
      />
    </div>
  );
}
