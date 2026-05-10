import { createClient } from "@/lib/supabase/server";
import { loadPublicUserProfile } from "@/lib/auth/profile-check";

export type ActorContext = {
  userId: string;
  tenantId: string;
  role: string;
};

/** Authenticated actor + tenant/role from `public.users`. */
export async function loadActorContext(): Promise<ActorContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await loadPublicUserProfile(user.id);
  if (!profile) return null;

  return {
    userId: user.id,
    tenantId: profile.tenantId,
    role: profile.role,
  };
}

