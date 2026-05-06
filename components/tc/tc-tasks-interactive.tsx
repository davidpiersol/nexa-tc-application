"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
import type { TcTaskRow } from "@/lib/queries/tc-dashboard";

async function getCsrf(): Promise<string | undefined> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  return json.csrfToken;
}

export function TcTasksInteractive({ tasks: initial }: { tasks: TcTaskRow[] }) {
  const router = useRouter();
  const [tasks, setTasks] = React.useState(initial);

  React.useEffect(() => {
    setTasks(initial);
  }, [initial]);

  async function toggle(id: string, nextCompleted: boolean) {
    const prev = tasks;
    setTasks((t) =>
      t.map((row) =>
        row.id === id ? { ...row, completed: nextCompleted } : row,
      ),
    );
    const token = await getCsrf();
    if (!token) {
      setTasks(prev);
      router.refresh();
      return;
    }
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({ completed: nextCompleted }),
    });
    if (!res.ok) {
      setTasks(prev);
      router.refresh();
    }
  }

  return (
    <ul className="mt-4 flex flex-col gap-3">
      {tasks.length === 0 ? (
        <li className="font-sans text-sm text-neutral-600">No tasks.</li>
      ) : null}
      {tasks.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between gap-3 rounded-brand-md border border-neutral-300 bg-white px-4 py-3 shadow-brand-sm"
        >
          <label className="flex flex-1 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={t.completed}
              className="size-4 accent-brand-gold"
              onChange={(e) => void toggle(t.id, e.target.checked)}
            />
            <span
              className={
                t.completed
                  ? "font-sans text-ui-body text-neutral-500 line-through"
                  : "font-sans text-ui-body text-neutral-900"
              }
            >
              {t.name}
            </span>
          </label>
          <div className="flex shrink-0 items-center gap-3">
            <Badge
              variant={
                t.priority === "high"
                  ? "gold"
                  : t.priority === "medium"
                    ? "navy"
                    : "neutral"
              }
            >
              {t.priority === "high"
                ? "High"
                : t.priority === "medium"
                  ? "Medium"
                  : "Low"}
            </Badge>
            <Link
              href={`/tc/transactions/${t.transactionId}`}
              className="font-sans text-sm font-medium text-brand-navy underline-offset-2 hover:underline"
            >
              Open
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
