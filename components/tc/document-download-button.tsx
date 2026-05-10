"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

type DownloadResponse = {
  url?: string;
  file_name?: string | null;
  error?: string;
};

export function DocumentDownloadButton({
  documentId,
  label = "Download",
  variant = "secondary",
  size = "sm",
  className,
}: {
  documentId: string;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  async function onDownload() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "GET",
        credentials: "include",
      });
      const body = (await res.json().catch(() => ({}))) as DownloadResponse;
      if (!res.ok || !body.url) return;

      // Signed URL keeps storage private while allowing a one-click open/download flow.
      window.open(body.url, "_blank", "noopener,noreferrer");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onDownload}
      disabled={pending}
      className={className}
    >
      {pending ? "Preparing…" : label}
    </Button>
  );
}
