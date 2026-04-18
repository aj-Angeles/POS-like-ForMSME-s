"use client";

import { ChevronDown, LogOut, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/hooks/use-session";
import { useSession } from "@/stores/session-store";

export function TopBar() {
  const { availableBusinesses, business, switchBusiness } = useSession();
  const role = useSession((s) => s.role);
  const signOut = useSignOut();

  if (!role) return null;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6 no-print">
      <div className="md:hidden flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
          <Store className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold truncate max-w-[160px]">{business?.name ?? ""}</div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {availableBusinesses.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Switch
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My businesses</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableBusinesses.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  onClick={() => switchBusiness(b, role)}
                  className="capitalize"
                >
                  {b.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Sign out"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
