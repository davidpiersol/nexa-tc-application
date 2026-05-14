import {
  COMMUNICATION_PROVIDER_PLANS,
  providerPlanStatusLabel,
} from "@/lib/operations/integration-planning";

export function CommunicationIntegrationPlan() {
  return (
    <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
      <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
        Communication integrations
      </p>
      <h2 className="mt-1 font-display text-heading-md text-brand-navy">
        Provider-scoped planning
      </h2>
      <p className="mt-3 font-sans text-sm text-neutral-600">
        These providers are planned as opt-in integrations. Nothing sends messages, emails, or
        calendar events until tenant credentials and user authorization are configured.
      </p>
      <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {COMMUNICATION_PROVIDER_PLANS.map((provider) => (
          <li
            key={provider.id}
            className="rounded-brand-md border border-neutral-200 bg-neutral-50 p-3"
          >
            <p className="font-display text-heading-sm text-brand-navy">{provider.name}</p>
            <p className="mt-1 font-sans text-xs font-semibold uppercase tracking-wide text-neutral-600">
              {providerPlanStatusLabel(provider.status)} · {provider.scope}
            </p>
            <p className="mt-2 font-sans text-sm text-neutral-700">{provider.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
