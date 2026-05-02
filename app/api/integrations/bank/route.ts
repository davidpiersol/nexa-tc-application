import { stubJson } from "@/lib/api/stub-response";

export function GET() {
  return stubJson("GET /api/integrations/bank");
}

export function POST() {
  return stubJson("POST /api/integrations/bank");
}
