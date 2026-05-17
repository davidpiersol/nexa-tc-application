import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request:Request){const url=new URL(request.url); const code=url.searchParams.get("code"); const supabase=await createClient(); if(code) await supabase.auth.exchangeCodeForSession(code); return NextResponse.redirect(new URL("/reset-password",url.origin));}
