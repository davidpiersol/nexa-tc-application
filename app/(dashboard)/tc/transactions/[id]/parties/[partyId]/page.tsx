import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getTransactionDetail,
  getTransactionPartyDetail,
} from "@/lib/queries/transaction-detail";

type Props = {
  params: {
    id: string;
    partyId: string;
  };
};

export default async function TransactionPartyDetailPage({ params }: Props) {
  const [tx, party] = await Promise.all([
    getTransactionDetail(params.id),
    getTransactionPartyDetail(params.id, params.partyId),
  ]);

  if (!tx || !party) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-neutral-300 pb-5">
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Transaction · {tx.mls_number ? `MLS #${tx.mls_number}` : tx.id}
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">Party details</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          {party.display_name ?? "Unnamed"} · {String(party.party_role).replace(/_/g, " ")}
        </p>
      </header>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">Display name</dt>
            <dd className="mt-1 font-sans text-ui-body text-neutral-900">
              {party.display_name ?? "Not set"}
            </dd>
          </div>

          <div>
            <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">Role</dt>
            <dd className="mt-1 font-sans text-ui-body text-neutral-900">
              {String(party.party_role).replace(/_/g, " ")}
            </dd>
          </div>

          <div>
            <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">Contact email</dt>
            <dd className="mt-1 font-sans text-ui-body text-neutral-900">
              {party.contact_email ?? "Not set"}
            </dd>
          </div>

          <div>
            <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">Party ID</dt>
            <dd className="mt-1 break-all font-mono text-sm text-neutral-900">{party.id}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" type="button" asChild>
          <Link href={`/tc/transactions/${params.id}`}>Back to transaction detail</Link>
        </Button>
        <Button variant="ghost" type="button" asChild>
          <Link href="/tc/transactions">Back to transactions</Link>
        </Button>
      </div>
    </div>
  );
}
