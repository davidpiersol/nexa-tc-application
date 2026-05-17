import { redirect } from "next/navigation";

export default function LegacyBrokerScopedProfileRedirect() {
  redirect("/agent/profile");
}
