"use client";

import { useMemo } from "react";

import { createClient } from "@/lib/supabase/client";

/** Memoized browser Supabase client. Used only by other hooks — components
 * do not consume this directly. */
export function useSupabase() {
  return useMemo(() => createClient(), []);
}
