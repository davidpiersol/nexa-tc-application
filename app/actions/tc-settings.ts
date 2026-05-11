"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  TC_DATE_FORMAT_OPTIONS,
  TC_TIMEZONE_OPTIONS,
} from "@/lib/tc-settings-options";

const updateTcSettingsSchema = z.object({
  fullName: z.string().trim().max(120),
  phone: z.string().trim().max(40),
  emailNotifications: z.boolean(),
  timezone: z.enum(TC_TIMEZONE_OPTIONS),
  dateFormat: z.enum(TC_DATE_FORMAT_OPTIONS),
  autoArchiveDays: z.number().int().min(0).max(3650),
});

export type UpdateTcSettingsInput = z.infer<typeof updateTcSettingsSchema>;

export async function updateTcSettings(
  input: UpdateTcSettingsInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = updateTcSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error: rowErr } = await supabase
    .from("users")
    .update({
      full_name: parsed.data.fullName || null,
      phone: parsed.data.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (rowErr) return { ok: false, error: rowErr.message };

  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const nextMetadata = {
    ...md,
    preferences: {
      ...(md.preferences as Record<string, unknown> | undefined),
      emailNotifications: parsed.data.emailNotifications,
      timezone: parsed.data.timezone,
      dateFormat: parsed.data.dateFormat,
      autoArchiveDays: parsed.data.autoArchiveDays,
    },
  };

  const { error: authErr } = await supabase.auth.updateUser({
    data: nextMetadata,
  });
  if (authErr) return { ok: false, error: authErr.message };

  return { ok: true };
}
