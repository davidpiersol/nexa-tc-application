import Link from "next/link";
import { Bell } from "lucide-react";
import {
  notificationSourceLabel,
  type OperationalNotification,
} from "@/lib/operations/notifications";
import { cn } from "@/lib/utils/cn";

export function OperationalNotificationCenter({
  notifications,
}: {
  notifications: OperationalNotification[];
}) {
  return (
    <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
            Operations center
          </p>
          <h2 className="mt-1 font-display text-heading-md text-brand-navy">
            Notifications and activity
          </h2>
        </div>
        <Bell className="size-5 text-brand-gold" aria-hidden />
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {notifications.length === 0 ? (
          <li className="font-sans text-sm text-neutral-600">No operational notifications.</li>
        ) : null}
        {notifications.map((notification) => {
          const content = (
            <>
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-brand-navy">{notification.title}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    notification.source === "ai"
                      ? "bg-brand-gold-light text-brand-navy"
                      : notification.source === "human"
                        ? "bg-brand-navy text-white"
                        : "bg-neutral-200 text-neutral-700",
                  )}
                >
                  {notificationSourceLabel(notification.source)}
                </span>
              </span>
              <span className="mt-1 block text-sm text-neutral-600">{notification.body}</span>
            </>
          );

          return (
            <li
              key={notification.id}
              className={cn(
                "rounded-brand-md border px-3 py-2 font-sans text-sm",
                notification.tone === "urgent"
                  ? "border-red-300 bg-red-50"
                  : notification.tone === "warning"
                    ? "border-brand-gold bg-brand-gold-light/25"
                    : "border-neutral-200 bg-neutral-50",
              )}
            >
              {notification.href ? (
                <Link href={notification.href} className="block">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
