export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-10">
      <h1 className="font-display text-heading-lg text-brand-navy">Access denied</h1>
      <p className="font-sans text-ui-body text-neutral-600">
        You don&apos;t have permission to view this workspace. If you believe this is a mistake,
        contact your transaction coordinator.
      </p>
    </div>
  );
}
