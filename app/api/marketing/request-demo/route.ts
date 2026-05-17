import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/client";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
type RequestDemoPayload = { name?: string; email?: string; company?: string; phone?: string; role?: string; message?: string; website?: string };
const clean = (value: string | undefined) => value?.trim() ?? "";
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
export async function POST(request: NextRequest) {
  const limited = await enforceApiRateLimit(request); if (limited) return limited;
  if (!(await validateCsrf(request))) return NextResponse.json({ error:"csrf_invalid" }, { status:403 });
  let body: RequestDemoPayload; try { body = await request.json() as RequestDemoPayload; } catch { return NextResponse.json({ error:"invalid_json" }, { status:400 }); }
  if (clean(body.website)) return NextResponse.json({ ok:true });
  const name=clean(body.name), email=clean(body.email), message=clean(body.message), company=clean(body.company), phone=clean(body.phone), role=clean(body.role);
  if (!name || !email || !message) return NextResponse.json({ error:"name_email_and_message_required" }, { status:400 });
  const from = process.env.EMAIL_FROM?.trim(); if (!from) return NextResponse.json({ error:"email_not_configured" }, { status:503 });
  const to = process.env.MARKETING_REQUEST_TO?.trim() || "info@choralpoint.com";
  const lines = ["New Choral Point information request", "", `Name: ${name}`, `Email: ${email}`, `Company: ${company || "—"}`, `Phone: ${phone || "—"}`, `Role: ${role || "—"}`, "", "Message:", message];
  try { await sendEmail({ tenantId: process.env.POSTMARK_INBOUND_DEFAULT_TENANT_ID?.trim() || "platform", From: from, To: to, Subject: `Choral Point information request from ${name}`, TextBody: lines.join("\n"), HtmlBody: lines.map((line)=>`<p>${escapeHtml(line) || "&nbsp;"}</p>`).join("") }); }
  catch (error) { console.error("request demo email failed", error); return NextResponse.json({ error:"email_send_failed" }, { status:502 }); }
  return NextResponse.json({ ok:true });
}
