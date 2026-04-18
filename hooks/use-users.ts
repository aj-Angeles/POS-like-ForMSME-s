"use client";

import { useCallback } from "react";

import { userService } from "@/lib/services";
import type { Membership, UserInvite, UserRole } from "@/lib/types";
import { useSession } from "@/stores/session-store";

import { useAsync } from "./use-async";
import { useSupabase } from "./use-supabase";

export function useMembers() {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);
  return useAsync<Membership[]>(async () => {
    if (!businessId) return [];
    return userService.listMembers(sb, businessId);
  }, [businessId]);
}

export function useInvites() {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);
  return useAsync<UserInvite[]>(async () => {
    if (!businessId) return [];
    return userService.listInvites(sb, businessId);
  }, [businessId]);
}

export function useUserMutations() {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);

  const invite = useCallback(
    async (email: string, role: UserRole) => {
      if (!businessId) throw new Error("No active business");
      return userService.createInvite(sb, businessId, email, role);
    },
    [sb, businessId],
  );
  const revoke = useCallback(async (id: string) => userService.revokeInvite(sb, id), [sb]);
  const setRole = useCallback(
    async (membershipId: string, role: UserRole) => userService.updateMemberRole(sb, membershipId, role),
    [sb],
  );
  const remove = useCallback(async (id: string) => userService.removeMember(sb, id), [sb]);

  return { invite, revoke, setRole, remove };
}
