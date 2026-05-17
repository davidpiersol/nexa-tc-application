import { redirect } from "next/navigation";
import { ProfileBody, formatRoleLabel } from "@/components/dashboard/profile-body";
import { roleFromUser } from "@/lib/auth/mfa";
import { isTenantAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function TenantAdminProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = roleFromUser(user);
  if (!isTenantAdminRole(role)) redirect("/forbidden");

  return (
    <ProfileBody email={user.email ?? null} roleLabel={formatRoleLabel(role)} userId={user.id} />
  );
}
