import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyerMessagesClient } from "@/components/buyer/buyer-messages-client";
import { Button } from "@/components/ui/button";
import { getTransactionDetail } from "@/lib/queries/transaction-detail";

type Props = { params: { id: string } };

export default async function BuyerMessagesPage({ params }: Props) {
  const transaction = await getTransactionDetail(params.id);
  if (!transaction) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-neutral-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-heading-lg text-brand-navy">Message TC</h2>
          <p className="mt-1 font-sans text-ui-body text-neutral-600">
            {transaction.property_address?.trim() || "Transaction"} · Conversation with your
            coordinator
          </p>
        </div>
        <Button variant="secondary" type="button" asChild>
          <Link href={`/buyer/${params.id}`}>Back to dashboard</Link>
        </Button>
      </div>

      <BuyerMessagesClient transactionId={params.id} />
    </div>
  );
}
