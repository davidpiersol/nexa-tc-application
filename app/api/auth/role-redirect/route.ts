import { NextResponse } from "next/server";
import { loadPublicUserProfile } from "@/lib/auth/profile-check";
import { isGlobalAdminRole, isTenantAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side default landing URL after sign-in (used when a session hits `/login`).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const base = new URL(request.url).origin;

  const profile = await loadPublicUserProfile(user.id);
  if (!profile) {
    return NextResponse.redirect(new URL("/auth/access-pending", base));
  }

  const role = profile.role;

  if (isGlobalAdminRole(role)) {
    return NextResponse.redirect(new URL("/admin/global/dashboard", base));
  }

  if (isTenantAdminRole(role)) {
    return NextResponse.redirect(new URL("/admin/tenant/dashboard", base));
  }

  if (role === "tc") {
    return NextResponse.redirect(new URL("/tc", base));
  }

  const { data: txs, error } = await supabase
    .from("transactions")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !txs?.length) {
    return NextResponse.redirect(new URL("/forbidden", base));
  }

  const txId = txs[0].id;

  switch (role) {
    case "buyer":
      return NextResponse.redirect(new URL(`/buyer/${txId}`, base));
    case "seller":
      return NextResponse.redirect(new URL(`/seller/${txId}`, base));
    case "mortgage":
      return NextResponse.redirect(new URL(`/mortgage/${txId}`, base));
    case "title":
      return NextResponse.redirect(new URL(`/title/${txId}`, base));
    case "agent":
    case "broker":
      return NextResponse.redirect(new URL("/agent", base));
    default:
      return NextResponse.redirect(new URL("/tc", base));
  }
}
