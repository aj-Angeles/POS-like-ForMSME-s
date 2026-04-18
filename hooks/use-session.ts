"use client";

import { useCallback, useEffect } from "react";

import { sessionService } from "@/lib/services";
import type { Business, Membership } from "@/lib/types";
import { useSession } from "@/stores/session-store";

import { useSupabase } from "./use-supabase";

/**
 * Loads memberships on mount and hydrates the session store. Call once in the
 * authenticated shell (app/(app)/layout.tsx).
 */
export function useSessionBootstrap() {
  const sb = useSupabase();
  const setSession = useSession((s) => s.setSession);
  const current = useSession((s) => s.business);
  const switchBusiness = useSession((s) => s.switchBusiness);

  const hydrate = useCallback(async () => {
    const user = await sessionService.getCurrentUser(sb);
    if (!user) {
      setSession({ userId: null, email: null, business: null, role: null, availableBusinesses: [] });
      return { user: null, memberships: [] as (Membership & { businesses: Business })[] };
    }
    const memberships = await sessionService.getMyMemberships(sb);
    const available = memberships.map((m) => m.businesses);
    const chosen =
      (current && available.find((b) => b.id === current.id)) ?? available[0] ?? null;
    const chosenRole =
      (chosen && memberships.find((m) => m.business_id === chosen.id)?.role) ?? null;

    setSession({
      userId: user.id,
      email: user.email ?? null,
      availableBusinesses: available,
    });
    if (chosen && chosenRole) switchBusiness(chosen, chosenRole);
    else setSession({ business: null, role: null });

    return { user, memberships };
  }, [sb, setSession, current, switchBusiness]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return { hydrate };
}

export function useSignOut() {
  const sb = useSupabase();
  const clear = useSession((s) => s.clear);
  return useCallback(async () => {
    await sb.auth.signOut();
    clear();
  }, [sb, clear]);
}
