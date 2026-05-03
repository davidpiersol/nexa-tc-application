import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTransactionDetail } from "@/lib/queries/transaction-detail";

type Props = { params: { id: string } };

/**
 * Figma: **Transaction Detail/Default** → `/tc/transactions/[id]`
 */
export default async function TransactionDetailPage({ params }: Props) {
  const t = await getTransactionDetail(params.id);
  if (!t) notFound();

  const milestone = String(t.status).replace(/_/g, " ");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-neutral-300 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
            Transaction · {t.mls_number ? `MLS #${t.mls_number}` : t.id}
          </p>
          <h2 className="mt-2 font-display text-heading-lg text-brand-navy">
            {t.property_address?.trim() || "Property address TBD"}
          </h2>
          <p className="mt-2 font-sans text-ui-body text-neutral-600">
            Status · <span className="text-brand-brown">{milestone}</span>
            {t.first_pass_status ? (
              <>
                {" "}
                · First pass ·{" "}
                <span className="font-medium text-brand-navy">{t.first_pass_status}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" type="button" asChild>
            <Link href={`/tc/transactions/${params.id}/documents`}>Documents</Link>
          </Button>
          <Button variant="gold" type="button" asChild>
            <Link href={`/tc/transactions/${params.id}/first-pass`}>First Pass</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-md text-brand-navy">Parties</h3>
          <ul className="mt-4 flex flex-col gap-2 font-sans text-ui-body text-neutral-900">
            {t.parties.length === 0 ? (
              <li className="text-neutral-600">No parties linked yet.</li>
            ) : null}
            {t.parties.map((p) => (
              <li key={p.party_role + (p.display_name ?? "") + (p.contact_email ?? "")}>
                <span className="font-semibold">{p.display_name ?? "Unnamed"}</span>
                <span className="text-neutral-600"> · {p.party_role.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-md text-brand-navy">Activity</h3>
          <p className="mt-4 font-prose text-prose-body text-neutral-900">
            Messages and audit events use Realtime on the Documents and First Pass tabs.
          </p>
        </section>
      </div>
    </div>
  );
}
