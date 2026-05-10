import { claimInviteJti, releaseInviteJti } from "@/lib/invite/redis";
import type { InviteJwtPayload } from "@/lib/invite/jwt";
import { inviteRoleAllowed } from "@/lib/auth/invite-role-policy";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export type OAuthInviteCompleteOk = { ok: true };

export type OAuthInviteCompleteErr = {
  ok: false;
  code:
    | "email_mismatch"
    | "invite_invalid"
    | "invite_used"
    | "profile_exists"
    | "provision_failed";
  message: string;
};

/**
 * After OAuth returns an authenticated user, apply invite tenant/role if the OAuth email matches.
 * Mirrors `/api/invite/redeem` but for users already created by the identity provider.
 */
export async function completeOAuthInviteProvision(params: {
  user: User;
  invite: InviteJwtPayload;
}): Promise<OAuthInviteCompleteOk | OAuthInviteCompleteErr> {
  const emailOAuth = params.user.email?.trim().toLowerCase();
  const emailInvite = params.invite.email.trim().toLowerCase();
  if (!emailOAuth || emailOAuth !== emailInvite) {
    return {
      ok: false,
      code: "email_mismatch",
      message: "Signed-in email does not match this invitation.",
    };
  }
  if (!inviteRoleAllowed(params.invite.role)) {
    return {
      ok: false,
      code: "invite_invalid",
      message: "Invite role is not eligible for OAuth self-provisioning.",
    };
  }

  const admin = createServiceRoleClient();

  const { data: existingProfile } = await admin.from("users").select("id").eq("id", params.user.id).maybeSingle();
  if (existingProfile) {
    return {
      ok: false,
      code: "profile_exists",
      message: "Account profile already exists.",
    };
  }

  const claimed = await claimInviteJti(params.invite.jti);
  if (!claimed) {
    return {
      ok: false,
      code: "invite_used",
      message: "This invitation was already used.",
    };
  }

  try {
    const tenant_id = params.invite.tenant_id;
    const role = params.invite.role;

    const { error: updateErr } = await admin.auth.admin.updateUserById(params.user.id, {
      email_confirm: true,
      user_metadata: {
        tenant_id,
        role,
      },
      app_metadata: {
        tenant_id,
        role,
      },
    });

    if (updateErr) {
      await releaseInviteJti(params.invite.jti);
      return {
        ok: false,
        code: "provision_failed",
        message: updateErr.message ?? "auth_update_failed",
      };
    }

    const { error: profileErr } = await admin.from("users").insert({
      id: params.user.id,
      tenant_id,
      email: params.invite.email,
      role,
    });

    if (profileErr) {
      await admin.auth.admin.deleteUser(params.user.id);
      await releaseInviteJti(params.invite.jti);
      return {
        ok: false,
        code: "provision_failed",
        message: profileErr.message,
      };
    }

    return { ok: true };
  } catch (e) {
    await releaseInviteJti(params.invite.jti);
    const msg = e instanceof Error ? e.message : "provision_failed";
    return {
      ok: false,
      code: "provision_failed",
      message: msg,
    };
  }
}
