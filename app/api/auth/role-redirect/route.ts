import { NextResponse } from "next/server";
import { roleFromUser } from "@/lib/auth/mfa";
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

  const role = roleFromUser(user);
  const base = new URL(request.url).origin;

  if (role === "tc" || role === "admin" || role === "superadmin") {
    return NextResponse.redirect(new URL("/tc", base));
  }

  const { data: txs, error } = await supabase
    .from("transactions")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !txs?.length) {
    return NextResponse.redirect(new URL("/tc", base));
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
      return NextResponse.redirect(new URL(`/agent/${txId}`, base));
    default:
      return NextResponse.redirect(new URL("/tc", base));
  }
}
