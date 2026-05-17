import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { sendWorkspaceInvite } from "@/lib/auth/invite-email";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { validateCsrf } from "@/lib/security/csrf-server";
const schema=z.object({email:z.string().email()});
export async function POST(request:NextRequest,{params}:{params:{tenantId:string}}){if(!(await validateCsrf(request)))return NextResponse.json({error:"csrf_invalid"},{status:403}); const {actor,error}=await requireGlobalAdmin(); if(error)return error; const parsed=schema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({error:"validation_error"},{status:400}); const admin=createServiceRoleClient(); const {data:tenant}=await admin.from("tenants").select("name").eq("id",params.tenantId).maybeSingle(); await sendWorkspaceInvite({tenantId:params.tenantId,actorId:actor!.userId,email:parsed.data.email,role:"tenant_admin",tenantName:tenant?.name}); return NextResponse.json({ok:true});}
