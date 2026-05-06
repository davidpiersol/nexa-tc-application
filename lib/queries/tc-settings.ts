import { createClient } from "@/lib/supabase/server";
import {
  isTcDateFormatOption,
  isTcTimezoneOption,
} from "@/lib/tc-settings-options";

export type TcSettingsData = {
  email: string;
  fullName: string;
  phone: string;
  emailNotifications: boolean;
  timezone: string;
  dateFormat: string;
};

/**
 * TC settings are user-scoped:
 * - profile fields from `public.users`
 * - preferences from auth `user_metadata.preferences`
 */
export async function getTcSettingsForCurrentUser(): Promise<TcSettingsData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const prefs = (md.preferences ?? {}) as Record<string, unknown>;

  const timezoneRaw = typeof prefs.timezone === "string" ? prefs.timezone : "";
  const dateFormatRaw =
    typeof prefs.dateFormat === "string" ? prefs.dateFormat : "";

  return {
    email: user.email ?? "",
    fullName: userRow?.full_name ?? "",
    phone: userRow?.phone ?? "",
    emailNotifications:
      typeof prefs.emailNotifications === "boolean"
        ? prefs.emailNotifications
        : true,
    timezone: isTcTimezoneOption(timezoneRaw)
      ? timezoneRaw
      : "America/Chicago",
    dateFormat: isTcDateFormatOption(dateFormatRaw)
      ? dateFormatRaw
      : "MM/DD/YYYY",
  };
}
