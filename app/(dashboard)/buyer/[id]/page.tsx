type Props = { params: { id: string } };

export default function BuyerDashboardPage({ params }: Props) {
  return (
    <div>
      <h2 className="font-display text-heading-md text-brand-navy">Buyer · {params.id}</h2>
      <p className="mt-2 text-ui-body text-neutral-600">Purchase progress — implement next.</p>
    </div>
  );
}
