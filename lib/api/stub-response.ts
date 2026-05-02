import { NextResponse } from "next/server";

export function stubJson(route: string) {
  return NextResponse.json(
    { stub: true, route, message: "Not implemented" },
    { status: 501 },
  );
}
