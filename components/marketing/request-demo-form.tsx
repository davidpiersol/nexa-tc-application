"use client";
import { useState } from "react";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
type FormState = "idle" | "pending" | "success" | "error";
export function RequestDemoForm() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("pending"); setMessage(null);
    const form = new FormData(event.currentTarget);
    const csrfRes = await fetch("/api/csrf", { credentials: "include" });
    const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
    const csrfToken = csrfJson.csrfToken;
    if (!csrfToken) { setState("error"); setMessage("Security token missing. Refresh and try again."); return; }
    const res = await fetch("/api/marketing/request-demo", { method:"POST", credentials:"include", headers:{"Content-Type":"application/json",[CSRF_HEADER_NAME]:csrfToken}, body: JSON.stringify({name:String(form.get("name")??""),email:String(form.get("email")??""),company:String(form.get("company")??""),phone:String(form.get("phone")??""),role:String(form.get("role")??""),message:String(form.get("message")??""),website:String(form.get("website")??"")}) });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) { setState("error"); setMessage(body.error ?? "Unable to send your request right now."); return; }
    event.currentTarget.reset(); setState("success"); setMessage("Thanks — your request has been sent.");
  }
  return <form className="choral-request-form" onSubmit={onSubmit}>
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span>Name</span><input name="name" required /></label>
      <label><span>Work email</span><input name="email" type="email" required /></label>
      <label><span>Company</span><input name="company" /></label>
      <label><span>Phone</span><input name="phone" /></label>
    </div>
    <label><span>Role</span><input name="role" placeholder="Transaction coordinator, broker, agent…" /></label>
    <label><span>What would you like to learn more about?</span><textarea name="message" rows={5} required /></label>
    <label className="hidden" aria-hidden><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
    {message ? <p className={state === "error" ? "text-status-danger" : "text-status-success"}>{message}</p> : null}
    <button className="choral-marketing-primary" disabled={state === "pending"} type="submit">{state === "pending" ? "Sending…" : "Send request"}</button>
  </form>;
}
