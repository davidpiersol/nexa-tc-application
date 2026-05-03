import { NextResponse } from "next/server";
import {
  processPostmarkInbound,
  verifyPostmarkInboundBasicAuth,
} from "@/lib/email/postmark-inbound";

export const runtime = "nodejs";

/**
 * Postmark **Inbound** webhook — Basic Auth + JSON body.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!verifyPostmarkInboundBasicAuth(auth)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: Parameters<typeof processPostmarkInbound>[0];
  try {
    payload = (await request.json()) as Parameters<typeof processPostmarkInbound>[0];
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const result = await processPostmarkInbound(payload);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "processing_failed";
    console.warn("[webhooks/email]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
