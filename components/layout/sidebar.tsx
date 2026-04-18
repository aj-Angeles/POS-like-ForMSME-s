"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSignOut } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

import { navForRole } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const { business, role, email } = useSession();
  const signOut = useSignOut();

  if (!role) return null;
  const items = navForRole(role);

  return (
    <aside className="hidden h-svh w-64 flex-col bg-sidebar text-sidebar-foreground md:flex no-print">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/20">
          <Store className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{business?.name ?? "—"}</div>
          <div className="truncate text-xs opacity-70 capitalize">{role}</div>
        </div>
      </div>
      <Separator className="bg-white/10" />
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Separator className="bg-white/10" />
      <div className="px-4 py-3">
        <div className="mb-2 truncate text-xs opacity-70">{email}</div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-white/5 hover:text-white"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
