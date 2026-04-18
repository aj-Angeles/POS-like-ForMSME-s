import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../supabase/database.types";

/** Typed Supabase client. All service functions accept this. */
export type SB = SupabaseClient<Database>;
