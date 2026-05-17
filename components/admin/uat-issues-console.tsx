"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type Issue = {
  id: string; issue_type: string; title: string; description: string; current_url: string | null;
  severity: string | null; status: string; created_at: string; submitted_by: string;
};

export function UatIssuesConsole() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [message, setMessage] = useState("");
  async function refresh() {
    const res = await fetch("/api/admin/uat-issues", { credentials: "include" });
    const body = await res.json() as { issues?: Issue[]; error?: string };
    if (res.ok) setIssues(body.issues ?? []); else setMessage(body.error ?? "Could not load issues.");
  }
  useEffect(() => { void refresh(); }, []);
  async function setStatus(id: string, status: string) {
    const csrf = await fetch("/api/csrf", { credentials: "include" }).then((r)=>r.json() as Promise<{csrfToken?:string}>);
    const res = await fetch("/api/admin/uat-issues", { method:"PATCH", credentials:"include", headers:{"Content-Type":"application/json",[CSRF_HEADER_NAME]:csrf.csrfToken ?? ""}, body: JSON.stringify({id,status}) });
    if (!res.ok) return setMessage("Could not update issue.");
    await refresh();
  }
  return <div className="space-y-3">
    {issues.map((issue)=><article key={issue.id} className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-sans text-xs uppercase tracking-wide text-neutral-600">{issue.issue_type} · {issue.severity ?? "unrated"} · {issue.status}</p>
          <h3 className="font-display text-heading-sm text-brand-navy">{issue.title}</h3>
          <p className="mt-2 whitespace-pre-wrap font-sans text-sm text-neutral-700">{issue.description}</p>
          <p className="mt-2 font-sans text-xs text-neutral-500">Submitted by {issue.submitted_by.slice(0, 8)} · {new Date(issue.created_at).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["new","triaged","planned","closed"].map((status)=><Button key={status} size="sm" variant={issue.status===status?"gold":"secondary"} onClick={()=>void setStatus(issue.id,status)}>{status}</Button>)}
        </div>
      </div>
    </article>)}
    {issues.length===0?<p className="font-sans text-sm text-neutral-600">No UAT issues submitted yet.</p>:null}
    {message?<p className="font-sans text-sm text-neutral-700">{message}</p>:null}
  </div>;
}
