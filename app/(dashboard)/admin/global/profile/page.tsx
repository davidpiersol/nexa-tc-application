import { redirect } from "next/navigation";
import { ProfileBody, formatRoleLabel } from "@/components/dashboard/profile-body";
import { roleFromUser } from "@/lib/auth/mfa";
import { isGlobalAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function GlobalAdminProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = roleFromUser(user);
  if (!isGlobalAdminRole(role)) redirect("/forbidden");

  return (
    <ProfileBody email={user.email ?? null} roleLabel={formatRoleLabel(role)} userId={user.id} />
  );
}
