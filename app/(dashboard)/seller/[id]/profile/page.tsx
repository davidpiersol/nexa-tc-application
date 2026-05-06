import { redirect } from "next/navigation";
import { ProfileBody, formatRoleLabel } from "@/components/dashboard/profile-body";
import { roleFromUser } from "@/lib/auth/mfa";
import { createClient } from "@/lib/supabase/server";

type Props = { params: { id: string } };

export default async function SellerProfilePage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ProfileBody
      email={user.email ?? null}
      roleLabel={formatRoleLabel(roleFromUser(user))}
      userId={user.id}
      workspaceTransactionId={params.id}
    />
  );
}
