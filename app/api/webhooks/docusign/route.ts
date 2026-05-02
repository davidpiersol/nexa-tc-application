import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;
  return NextResponse.json({ received: true, stub: true }, { status: 200 });
}
