import { createBrowserClient } from "@supabase/ssr";
import {
  resolvePublicSupabaseAnonKey,
  resolvePublicSupabaseUrl,
} from "@/lib/supabase/env";

/** Fill `.env.local`; placeholders allow `next build` without secrets. */
export function createClient() {
  return createBrowserClient(resolvePublicSupabaseUrl(), resolvePublicSupabaseAnonKey());
}
