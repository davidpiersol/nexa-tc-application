import { createClient } from "@/lib/supabase/server";
import { canAccessContacts } from "@/lib/contacts/permissions";
import { loadActorContext } from "@/lib/auth/actor-context";

export type ContactLookupOption = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  categories: string[];
  isBrokerClient: boolean;
};

export async function getContactLookupOptions(): Promise<ContactLookupOption[]> {
  const actor = await loadActorContext();
  if (!actor || !canAccessContacts(actor.role)) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, full_name, email, phone, company")
    .eq("tenant_id", actor.tenantId)
    .order("full_name", { ascending: true })
    .limit(300);
  if (error) return [];
  const ids = (data ?? []).map((row) => row.id);
  const { data: categoryRows } = ids.length
    ? await supabase
        .from("contact_category_assignments")
        .select("contact_id, category")
        .eq("tenant_id", actor.tenantId)
        .in("contact_id", ids)
    : { data: [] as { contact_id: string; category: string }[] };
  const categoriesById = new Map<string, string[]>();
  for (const row of categoryRows ?? []) {
    const current = categoriesById.get(row.contact_id) ?? [];
    current.push(row.category);
    categoriesById.set(row.contact_id, current);
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    categories: categoriesById.get(row.id) ?? [],
    isBrokerClient: (categoriesById.get(row.id) ?? []).includes("broker"),
  }));
}
