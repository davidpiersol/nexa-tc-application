"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateTcSettings } from "@/app/actions/tc-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TC_DATE_FORMAT_OPTIONS,
  TC_TIMEZONE_OPTIONS,
} from "@/lib/tc-settings-options";
import type { TcSettingsData } from "@/lib/queries/tc-settings";

export function TcSettingsForm({ initial }: { initial: TcSettingsData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setSaved(false);

    const fullName = String(formData.get("fullName") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const emailNotifications =
      String(formData.get("emailNotifications") ?? "") === "on";
    const timezone = String(formData.get("timezone") ?? "");
    const dateFormat = String(formData.get("dateFormat") ?? "");
    const autoArchiveDaysRaw = String(formData.get("autoArchiveDays") ?? "");
    const autoArchiveDays = Number.parseInt(autoArchiveDaysRaw, 10);

    const res = await updateTcSettings({
      fullName,
      phone,
      emailNotifications,
      timezone: timezone as (typeof TC_TIMEZONE_OPTIONS)[number],
      dateFormat: dateFormat as (typeof TC_DATE_FORMAT_OPTIONS)[number],
      autoArchiveDays: Number.isFinite(autoArchiveDays) ? autoArchiveDays : 30,
    });

    if (!res.ok) {
      setError("Could not save settings. Please try again.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form
      className="mt-6 grid grid-cols-1 gap-6 rounded-brand-lg border border-neutral-300 bg-white p-6 shadow-brand-sm"
      action={(formData) => {
        startTransition(() => {
          void onSubmit(formData);
        });
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Email" value={initial.email} readOnly />
        <Input
          label="Full name"
          name="fullName"
          defaultValue={initial.fullName}
          autoComplete="name"
        />
        <Input
          label="Phone"
          name="phone"
          defaultValue={initial.phone}
          autoComplete="tel"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
            Timezone
          </span>
          <select
            name="timezone"
            defaultValue={initial.timezone}
            className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          >
            {TC_TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
            Date format
          </span>
          <select
            name="dateFormat"
            defaultValue={initial.dateFormat}
            className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          >
            {TC_DATE_FORMAT_OPTIONS.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Auto-archive closed transactions after (days)"
          name="autoArchiveDays"
          type="number"
          min={0}
          max={3650}
          defaultValue={String(initial.autoArchiveDays)}
        />
      </div>

      <label className="flex items-center gap-3 rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2">
        <input
          type="checkbox"
          name="emailNotifications"
          defaultChecked={initial.emailNotifications}
          className="size-4 accent-brand-gold"
        />
        <span className="font-sans text-ui-body text-neutral-900">
          Email notifications for task and document updates
        </span>
      </label>

      {error ? <p className="font-sans text-sm text-status-danger">{error}</p> : null}
      {saved ? (
        <p className="font-sans text-sm text-status-success">
          Settings saved successfully.
        </p>
      ) : null}

      <div>
        <Button type="submit" variant="gold" disabled={isPending}>
          {isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
