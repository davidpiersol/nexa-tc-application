import { redirect } from "next/navigation";
import { ProfileBody, formatRoleLabel } from "@/components/dashboard/profile-body";
import { BrokerSigningPreferencesForm } from "@/components/agent/broker-signing-preferences-form";
import { roleFromUser } from "@/lib/auth/mfa";
import { createClient } from "@/lib/supabase/server";

export default async function BrokerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const jwtRole = roleFromUser(user);
  if (jwtRole !== "broker" && jwtRole !== "agent") redirect("/login");

  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .ilike("email", user.email.trim())
    .maybeSingle();

  const { data: bp } = contact?.id
    ? await supabase
        .from("broker_profiles")
        .select("signing_platform, signing_preferences")
        .eq("contact_id", contact.id as string)
        .maybeSingle()
    : { data: null };

  const prefsRaw = bp?.signing_preferences ?? {};
  const prefsJson =
    typeof prefsRaw === "object" && prefsRaw !== null
      ? JSON.stringify(prefsRaw, null, 2)
      : "{}";

  return (
    <div className="mx-auto max-w-lg">
      <ProfileBody
        email={user.email ?? null}
        roleLabel={formatRoleLabel(jwtRole)}
        userId={user.id}
      />
      {bp ? (
        <BrokerSigningPreferencesForm
          initialSigningPlatform={
            typeof bp.signing_platform === "string" ? bp.signing_platform : ""
          }
          initialSigningPreferencesJson={prefsJson}
        />
      ) : (
        <p className="mt-6 rounded-brand-md border border-neutral-200 bg-neutral-50 px-4 py-3 font-sans text-sm text-neutral-700">
          Your TC hasn&apos;t linked a broker profile record to your email yet — signing self-service
          will appear here once that profile exists.
        </p>
      )}
    </div>
  );
}
