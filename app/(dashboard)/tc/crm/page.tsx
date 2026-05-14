import {
  CRM_LITE_BOUNDARIES,
  CRM_PROVIDER_CATALOG,
  defaultCrmAdapterCapabilities,
} from "@/lib/crm/catalog";

export default function TcCrmPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-neutral-300 pb-5">
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          CRM-lite scaffold
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">CRM</h2>
        <p className="mt-2 max-w-3xl font-sans text-ui-body text-neutral-600">
          Choral Point keeps contacts as the canonical relationship source. This module defines
          CRM-lite boundaries and external adapter candidates, but no provider sync is active until
          credentials, consent, and field mappings are approved.
        </p>
      </header>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <h3 className="font-display text-heading-md text-brand-navy">CRM-lite boundaries</h3>
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {CRM_LITE_BOUNDARIES.map((boundary) => (
            <li
              key={boundary}
              className="rounded-brand-md border border-neutral-200 bg-neutral-50 p-3 font-sans text-sm text-neutral-800"
            >
              {boundary}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <h3 className="font-display text-heading-md text-brand-navy">External CRM candidates</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {CRM_PROVIDER_CATALOG.map((provider) => (
            <article
              key={provider.key}
              className="rounded-brand-md border border-neutral-200 bg-neutral-50 p-3"
            >
              <p className="font-display text-heading-sm text-brand-navy">{provider.label}</p>
              <p className="mt-1 font-sans text-xs font-semibold uppercase tracking-wide text-neutral-600">
                {provider.status.replace(/_/g, " ")} · {provider.authModes.join(", ")}
              </p>
              <p className="mt-2 font-sans text-sm text-neutral-700">{provider.summary}</p>
              <p className="mt-2 font-sans text-sm font-semibold text-brand-brown">
                {provider.guardrail}
              </p>
              <ul className="mt-3 space-y-1 font-sans text-xs text-neutral-600">
                {defaultCrmAdapterCapabilities(provider.key).map((capability) => (
                  <li key={capability.operation}>
                    {capability.operation.replace(/_/g, " ")} · disabled
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
