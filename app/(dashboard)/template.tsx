import { PageEnter } from "@/components/motion/page-enter";

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageEnter>{children}</PageEnter>;
}
