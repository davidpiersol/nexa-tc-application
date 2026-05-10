import { redirect } from "next/navigation";

export default async function GlobalAdminPage() {
  redirect("/admin/global/dashboard");
}

