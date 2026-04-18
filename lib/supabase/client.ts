import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Browser-side Supabase client. DO NOT import this from a React component.
 * Use a hook from /hooks or a service in /lib/services so the UI layer stays
 * swappable.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
