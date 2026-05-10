import { redirect } from "next/navigation";

export default async function TenantAdminPage() {
  redirect("/admin/tenant/dashboard");
}

