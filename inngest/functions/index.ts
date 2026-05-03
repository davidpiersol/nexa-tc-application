import { inngest } from "@/lib/inngest/client";
import aiFirstPass from "./aiFirstPass";

/** Background jobs — expand as workflows are implemented. */
export const functions = [
  inngest.createFunction(
    { id: "nexa.placeholder.ping", name: "Placeholder ping" },
    { event: "nexa/ping" },
    async () => ({ ok: true, at: new Date().toISOString() }),
  ),
  aiFirstPass,
];
