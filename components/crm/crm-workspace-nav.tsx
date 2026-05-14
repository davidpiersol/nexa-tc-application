import Link from "next/link";
import { CalendarDays, Clock, Link2, Network, Plug, Upload, UsersRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function CrmWorkspaceNav({ basePath }: { basePath: string }) {
  const items: Item[] = [
    { href: basePath, label: "Upcoming", icon: Clock },
    { href: `${basePath}/tasks`, label: "Tasks", icon: UsersRound },
    { href: `${basePath}/reminders`, label: "Reminders", icon: CalendarDays },
    { href: `${basePath}/touch-history`, label: "Touches", icon: Link2 },
    { href: `${basePath}/notes`, label: "Notes", icon: Network },
    { href: `${basePath}/relationships`, label: "Relationships", icon: UsersRound },
    { href: `${basePath}/segments`, label: "Segments", icon: Network },
    { href: `${basePath}/calendar`, label: "Calendar", icon: CalendarDays },
    { href: `${basePath}/import-export`, label: "Import / Export", icon: Upload },
    { href: `${basePath}/connections`, label: "Connections", icon: Plug },
  ];

  return (
    <nav className="overflow-x-auto border-b border-neutral-300 pb-3" aria-label="CRM sections">
      <div className="flex min-w-max gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Button key={item.href} asChild variant="secondary" size="sm">
              <Link href={item.href}>
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
