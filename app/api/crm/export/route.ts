import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { loadActorContext } from "@/lib/auth/actor-context";
import { canUseCrm } from "@/lib/crm/api";
import { listCrmContactOptions } from "@/lib/crm/queries";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";

function csvEscape(value: string | null): string {
  const text = value ?? "";
  return `"${text.replace(/"/g, '""')}"`;
}

function contactVCard(contact: { fullName: string; email: string | null; company: string | null }): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${contact.fullName}`,
    contact.company ? `ORG:${contact.company}` : null,
    contact.email ? `EMAIL:${contact.email}` : null,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function GET(request: NextRequest) {
  const actor = await loadActorContext();
  const limited = await enforceApiRateLimit(request, actor?.userId);
  if (limited) return limited;
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canUseCrm(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const format = request.nextUrl.searchParams.get("format") === "vcf" ? "vcf" : "csv";
  const contacts = await listCrmContactOptions(actor);
  if (format === "vcf") {
    const body = contacts.map(contactVCard).join("\n");
    return new NextResponse(body, {
      headers: {
        "content-type": "text/vcard; charset=utf-8",
        "content-disposition": 'attachment; filename="choral-point-crm-contacts.vcf"',
      },
    });
  }

  const header = ["Name", "Email", "Company", "Broker Client"].map(csvEscape).join(",");
  const rows = contacts.map((contact) =>
    [contact.fullName, contact.email, contact.company, contact.isBroker ? "Yes" : "No"]
      .map(csvEscape)
      .join(","),
  );
  return new NextResponse([header, ...rows].join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="choral-point-crm-contacts.csv"',
    },
  });
}
