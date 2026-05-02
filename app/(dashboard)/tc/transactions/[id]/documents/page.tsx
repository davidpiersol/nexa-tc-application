type Props = { params: { id: string } };

export default function TransactionDocumentsPage({ params }: Props) {
  return (
    <div>
      <h2 className="font-display text-heading-md text-brand-navy">
        Documents · {params.id}
      </h2>
      <p className="mt-2 text-ui-body text-neutral-600">Document manager — implement next.</p>
    </div>
  );
}
