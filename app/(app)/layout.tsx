import { redirect } from "next/navigation";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { createClient } from "@/lib/supabase/server";

import { SessionBootstrap } from "./_session-bootstrap";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await sb.from("memberships").select("business_id").limit(1);
  if (!memberships || memberships.length === 0) redirect("/setup");

  return (
    <ThemeProvider>
      <SessionBootstrap />
      <div className="flex min-h-svh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4 md:px-8 md:pb-8">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </ThemeProvider>
  );
}
