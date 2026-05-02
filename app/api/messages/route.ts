import { stubJson } from "@/lib/api/stub-response";

export function GET() {
  return stubJson("GET /api/messages");
}

export function POST() {
  return stubJson("POST /api/messages");
}
