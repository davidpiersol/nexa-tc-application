import { PageEnter } from "@/components/motion/page-enter";

export default function AuthTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageEnter>{children}</PageEnter>;
}
