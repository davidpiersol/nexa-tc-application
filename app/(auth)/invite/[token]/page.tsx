type Props = { params: { token: string } };

export default function InviteAcceptPage({ params }: Props) {
  return (
    <div>
      <h1 className="font-display text-heading-lg text-brand-navy">Accept invite</h1>
      <p className="mt-2 text-ui-body text-neutral-600">
        Token: <code className="rounded bg-neutral-100 px-1">{params.token}</code>
      </p>
    </div>
  );
}
