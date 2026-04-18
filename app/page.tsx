import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await sb.from("memberships").select("business_id").limit(1);
  if (!memberships || memberships.length === 0) redirect("/setup");

  redirect("/dashboard");
}
