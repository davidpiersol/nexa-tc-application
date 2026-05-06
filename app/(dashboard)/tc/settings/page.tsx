import { TcSettingsForm } from "@/components/tc/tc-settings-form";
import { getTcSettingsForCurrentUser } from "@/lib/queries/tc-settings";

export default async function TcSettingsPage() {
  const settings = await getTcSettingsForCurrentUser();

  if (!settings) {
    return (
      <div className="rounded-brand-lg border border-status-danger/40 bg-white p-6 shadow-brand-sm">
        <h2 className="font-display text-heading-md text-brand-navy">
          TC settings
        </h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-700">
          Could not load your session settings. Please sign in again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-heading-md text-brand-navy">TC settings</h2>
      <p className="mt-2 font-sans text-ui-body text-neutral-600">
        Manage your profile and workspace preferences.
      </p>
      <TcSettingsForm initial={settings} />
    </div>
  );
}
