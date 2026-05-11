import { NextResponse, type NextRequest } from "next/server";
import { loadActorContext } from "@/lib/auth/actor-context";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { canWriteContacts } from "@/lib/contacts/permissions";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";

type Ctx = { params: { id: string } };

function normalizedNeedles(input: Array<string | null | undefined>): string[] {
  const values = input
    .map((value) => (value ?? "").trim().toLowerCase())
    .filter((value) => value.length >= 3);
  return Array.from(new Set(values));
}

type ImpactRow = {
  transactionId: string;
  propertyAddress: string | null;
  mlsNumber: string | null;
  status: string;
  matchedFields: string[];
};

export async function GET(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canWriteContacts(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createServiceRoleClient();
  const { data: contact, error: contactErr } = await admin
    .from("contacts")
    .select("id, full_name, first_name, last_name, email, phone")
    .eq("tenant_id", actor.tenantId)
    .eq("id", ctx.params.id)
    .maybeSingle();
  if (contactErr) return NextResponse.json({ error: contactErr.message }, { status: 500 });
  if (!contact) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const needles = normalizedNeedles([
    contact.full_name,
    [contact.first_name, contact.last_name].filter(Boolean).join(" "),
    contact.email,
    contact.phone,
  ]);

  if (needles.length === 0) {
    return NextResponse.json({
      contact: { id: contact.id, fullName: contact.full_name, email: contact.email },
      impact: { intakeMatches: [], partyMatches: [], total: 0 },
    });
  }

  const { data: transactions, error: txErr } = await admin
    .from("transactions")
    .select("id, property_address, mls_number, status, intake_data")
    .eq("tenant_id", actor.tenantId)
    .order("updated_at", { ascending: false })
    .limit(300);
  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });

  const txMap = new Map<
    string,
    { propertyAddress: string | null; mlsNumber: string | null; status: string }
  >();
  const intakeMatches: ImpactRow[] = [];
  for (const tx of transactions ?? []) {
    txMap.set(tx.id, {
      propertyAddress: tx.property_address,
      mlsNumber: tx.mls_number,
      status: String(tx.status),
    });

    const intakeData =
      tx.intake_data && typeof tx.intake_data === "object" && !Array.isArray(tx.intake_data)
        ? (tx.intake_data as Record<string, unknown>)
        : null;
    if (!intakeData) continue;

    const matchedFields: string[] = [];
    for (const [key, value] of Object.entries(intakeData)) {
      if (typeof value !== "string") continue;
      const text = value.trim().toLowerCase();
      if (!text) continue;
      if (needles.some((needle) => text.includes(needle))) matchedFields.push(key);
    }

    if (matchedFields.length > 0) {
      intakeMatches.push({
        transactionId: tx.id,
        propertyAddress: tx.property_address,
        mlsNumber: tx.mls_number,
        status: String(tx.status),
        matchedFields: matchedFields.slice(0, 8),
      });
    }
  }

  const { data: parties, error: partyErr } = await admin
    .from("transaction_parties")
    .select("transaction_id, display_name, contact_email, party_role")
    .eq("tenant_id", actor.tenantId)
    .limit(1000);
  if (partyErr) return NextResponse.json({ error: partyErr.message }, { status: 500 });

  const partyByTransaction = new Map<string, Set<string>>();
  for (const party of parties ?? []) {
    const displayName = (party.display_name ?? "").trim().toLowerCase();
    const contactEmail = (party.contact_email ?? "").trim().toLowerCase();
    const role = String(party.party_role ?? "").trim();
    const matchesDisplay = displayName.length > 0 && needles.some((needle) => displayName.includes(needle));
    const matchesEmail = contactEmail.length > 0 && needles.some((needle) => contactEmail.includes(needle));
    if (!matchesDisplay && !matchesEmail) continue;
    const current = partyByTransaction.get(party.transaction_id) ?? new Set<string>();
    if (matchesDisplay) current.add(`party:${role || "unknown"}`);
    if (matchesEmail) current.add("party_email");
    partyByTransaction.set(party.transaction_id, current);
  }

  const partyMatches: ImpactRow[] = Array.from(partyByTransaction.entries()).map(
    ([transactionId, matchSet]) => {
      const tx = txMap.get(transactionId);
      return {
        transactionId,
        propertyAddress: tx?.propertyAddress ?? null,
        mlsNumber: tx?.mlsNumber ?? null,
        status: tx?.status ?? "unknown",
        matchedFields: Array.from(matchSet),
      };
    },
  );

  return NextResponse.json({
    contact: { id: contact.id, fullName: contact.full_name, email: contact.email },
    impact: {
      intakeMatches: intakeMatches.slice(0, 20),
      partyMatches: partyMatches.slice(0, 20),
      total: intakeMatches.length + partyMatches.length,
    },
  });
}
