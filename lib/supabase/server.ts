import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Server-side Supabase client. Reads/writes auth cookies via Next's cookies().
 * Use from Server Components, route handlers, and Server Actions.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — can't write cookies. Middleware
            // refreshes the session, so ignore.
          }
        },
      },
    },
  );
}
