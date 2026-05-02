import { stubJson } from "@/lib/api/stub-response";

export function GET() {
  return stubJson("GET /api/integrations/mls");
}

export function POST() {
  return stubJson("POST /api/integrations/mls");
}
