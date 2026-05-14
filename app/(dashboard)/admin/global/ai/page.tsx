import { redirect } from "next/navigation";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isGlobalAdminRole } from "@/lib/auth/roles";
import {
  AI_FEATURE_CATALOG,
  AI_PROVIDER_CATALOG,
  defaultAiFeatureSettings,
} from "@/lib/ai/catalog";

export default async function GlobalAdminAiPage() {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isGlobalAdminRole(actor.role)) redirect("/forbidden");

  const settings = defaultAiFeatureSettings();

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-neutral-300 pb-5">
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Provider-neutral AI
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">AI Configuration</h2>
        <p className="mt-2 max-w-3xl font-sans text-ui-body text-neutral-600">
          P28 scaffolds model/provider governance, feature-level defaults, cost controls, and audit
          requirements. AI is disabled by default and every legally sensitive workflow remains
          human-review only.
        </p>
      </header>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <h3 className="font-display text-heading-md text-brand-navy">Provider catalog</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {AI_PROVIDER_CATALOG.map((provider) => (
            <article
              key={provider.key}
              className="rounded-brand-md border border-neutral-200 bg-neutral-50 p-3"
            >
              <p className="font-sans text-sm font-semibold text-brand-navy">{provider.label}</p>
              <p className="mt-1 font-sans text-xs uppercase tracking-wide text-neutral-600">
                {provider.authMode}
                {provider.credentialProvider ? ` · ${provider.credentialProvider}` : ""}
              </p>
              <p className="mt-2 font-sans text-sm text-neutral-700">{provider.notes}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <h3 className="font-display text-heading-md text-brand-navy">Feature defaults</h3>
        <p className="mt-2 font-sans text-sm text-neutral-600">
          Admin-selectable settings are represented per feature in the P28 schema. Defaults below
          are intentionally disabled until credentials, tenant budget, and review rules are approved.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[840px] text-left font-sans text-sm">
            <thead className="border-b border-neutral-200 text-ui-label uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="py-2 pr-4">Feature</th>
                <th className="py-2 pr-4">Default provider</th>
                <th className="py-2 pr-4">Model class</th>
                <th className="py-2 pr-4">Max tokens</th>
                <th className="py-2 pr-4">Budget</th>
                <th className="py-2 pr-4">Review rule</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => {
                const feature = AI_FEATURE_CATALOG.find((item) => item.key === setting.featureKey);
                return (
                  <tr key={setting.featureKey} className="border-b border-neutral-100">
                    <td className="py-3 pr-4 text-brand-navy">
                      {feature?.label ?? setting.featureKey}
                    </td>
                    <td className="py-3 pr-4">{setting.providerKey}</td>
                    <td className="py-3 pr-4">{setting.modelKey}</td>
                    <td className="py-3 pr-4">{setting.maxOutputTokens}</td>
                    <td className="py-3 pr-4">
                      {setting.monthlyBudgetCents === 0 ? "Disabled" : setting.monthlyBudgetCents}
                    </td>
                    <td className="py-3 pr-4">
                      {feature?.safetyBoundary ?? "Human review required"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
