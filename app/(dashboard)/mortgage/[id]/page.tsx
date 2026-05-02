type Props = { params: { id: string } };

export default function MortgageDashboardPage({ params }: Props) {
  return (
    <div>
      <h2 className="font-display text-heading-md text-brand-navy">
        Mortgage · {params.id}
      </h2>
      <p className="mt-2 text-ui-body text-neutral-600">Loan milestones — implement next.</p>
    </div>
  );
}
