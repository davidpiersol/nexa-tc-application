import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import {
  resolvePublicSupabaseAnonKey,
  resolvePublicSupabaseUrl,
} from "@/lib/supabase/env";

type CookieSetItem = { name: string; value: string; options?: CookieOptions };

/**
 * Supabase session refresh in Next.js middleware (Edge).
 * Mutates the response with Set-Cookie from Supabase.
 */
export function createMiddlewareSupabase(
  request: NextRequest,
  response: NextResponse,
) {
  const url = resolvePublicSupabaseUrl();
  const key = resolvePublicSupabaseAnonKey();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieSetItem[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
