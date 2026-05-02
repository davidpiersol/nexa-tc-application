type Props = { params: { id: string } };

export default function TitleDashboardPage({ params }: Props) {
  return (
    <div>
      <h2 className="font-display text-heading-md text-brand-navy">Title · {params.id}</h2>
      <p className="mt-2 text-ui-body text-neutral-600">Closing prep — implement next.</p>
    </div>
  );
}
