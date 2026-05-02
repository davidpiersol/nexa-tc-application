type Props = { params: { id: string } };

export default function AgentDashboardPage({ params }: Props) {
  return (
    <div>
      <h2 className="font-display text-heading-md text-brand-navy">Agent · {params.id}</h2>
      <p className="mt-2 text-ui-body text-neutral-600">Transaction status — implement next.</p>
    </div>
  );
}
