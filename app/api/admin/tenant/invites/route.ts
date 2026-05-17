import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireTenantAdminOrGlobal } from "@/lib/auth/admin-guard";
import { sendWorkspaceInvite } from "@/lib/auth/invite-email";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
const schema=z.object({email:z.string().email(),role:z.enum(["admin","tc","agent","broker","buyer","seller","mortgage","title"])});
export async function POST(request:NextRequest){const limited=await enforceApiRateLimit(request); if(limited)return limited; if(!(await validateCsrf(request)))return NextResponse.json({error:"csrf_invalid"},{status:403}); const {actor,error}=await requireTenantAdminOrGlobal(); if(error)return error; const parsed=schema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({error:"validation_error"},{status:400}); await sendWorkspaceInvite({tenantId:actor!.tenantId,actorId:actor!.userId,email:parsed.data.email,role:parsed.data.role}); return NextResponse.json({ok:true});}
