import { stubJson } from "@/lib/api/stub-response";

export function GET() {
  return stubJson("GET /api/checklists");
}

export function POST() {
  return stubJson("POST /api/checklists");
}
