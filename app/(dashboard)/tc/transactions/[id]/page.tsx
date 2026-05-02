type Props = { params: { id: string } };

export default function TransactionDetailPage({ params }: Props) {
  return (
    <div>
      <h2 className="font-display text-heading-md text-brand-navy">
        Transaction {params.id}
      </h2>
      <p className="mt-2 text-ui-body text-neutral-600">Detail shell — implement next.</p>
    </div>
  );
}
