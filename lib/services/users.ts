import type { Membership, UserInvite, UserRole } from "../types";
import type { SB } from "./types";

export async function listMembers(
  sb: SB,
  businessId: string,
): Promise<Membership[]> {
  const { data, error } = await sb
    .from("memberships")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateMemberRole(
  sb: SB,
  membershipId: string,
  role: UserRole,
): Promise<Membership> {
  const { data, error } = await sb
    .from("memberships")
    .update({ role })
    .eq("id", membershipId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function removeMember(sb: SB, membershipId: string): Promise<void> {
  const { error } = await sb.from("memberships").delete().eq("id", membershipId);
  if (error) throw error;
}

export async function listInvites(sb: SB, businessId: string): Promise<UserInvite[]> {
  const { data, error } = await sb
    .from("user_invites")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createInvite(
  sb: SB,
  businessId: string,
  email: string,
  role: UserRole,
): Promise<UserInvite> {
  const { data, error } = await sb
    .from("user_invites")
    .insert({ business_id: businessId, email, role })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function revokeInvite(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("user_invites").update({ status: "revoked" }).eq("id", id);
  if (error) throw error;
}
