"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

import { bottomNavForRole } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const role = useSession((s) => s.role);
  if (!role) return null;
  const items = bottomNavForRole(role);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t bg-background md:hidden no-print">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-xs",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
