"use client";

import { useSessionBootstrap } from "@/hooks/use-session";

/** Invisible client component that hydrates the session store on mount. */
export function SessionBootstrap() {
  useSessionBootstrap();
  return null;
}
