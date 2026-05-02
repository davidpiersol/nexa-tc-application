type Props = { params: { id: string } };

export default function SellerDashboardPage({ params }: Props) {
  return (
    <div>
      <h2 className="font-display text-heading-md text-brand-navy">Seller · {params.id}</h2>
      <p className="mt-2 text-ui-body text-neutral-600">Sale progress — implement next.</p>
    </div>
  );
}
