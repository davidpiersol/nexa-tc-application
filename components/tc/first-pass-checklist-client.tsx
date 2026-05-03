"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChecklistPanel } from "@/components/ui/checklist-panel";
import type { ChecklistItem } from "@/components/ui/checklist-panel";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

async function getCsrf(): Promise<string | undefined> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  return json.csrfToken;
}

export function FirstPassChecklistClient({ items }: { items: ChecklistItem[] }) {
  const router = useRouter();

  async function onItemChange(id: string, checked: boolean) {
    const token = await getCsrf();
    if (!token) {
      router.refresh();
      return;
    }
    const res = await fetch(`/api/checklist-items/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({ completed: checked }),
    });
    if (!res.ok) {
      router.refresh();
    }
  }

  return (
    <ChecklistPanel
      title="Verification checklist"
      items={items}
      animateComplete
      onItemChange={(id, checked) => {
        void onItemChange(id, checked);
      }}
    />
  );
}
