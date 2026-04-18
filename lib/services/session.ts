import type { Business, Membership } from "../types";
import type { SB } from "./types";

export async function getCurrentUser(sb: SB) {
  const { data } = await sb.auth.getUser();
  return data.user;
}

export async function getMyMemberships(
  sb: SB,
): Promise<(Membership & { businesses: Business })[]> {
  const { data, error } = await sb
    .from("memberships")
    .select("*, businesses!inner(*)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as (Membership & { businesses: Business })[];
}

export async function getBusiness(sb: SB, businessId: string): Promise<Business | null> {
  const { data, error } = await sb.from("businesses").select("*").eq("id", businessId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function bootstrapBusiness(
  sb: SB,
  input: { name: string; industry?: string; currency?: string; symbol?: string; full_name?: string },
): Promise<Business> {
  const { data, error } = await sb.rpc("bootstrap_business", {
    p_name: input.name,
    p_industry: input.industry ?? "",
    p_currency: input.currency ?? "PHP",
    p_symbol: input.symbol ?? "₱",
    p_full_name: input.full_name ?? "",
  });
  if (error) throw error;
  return data as unknown as Business;
}

export async function updateBusiness(
  sb: SB,
  businessId: string,
  patch: Partial<Business>,
): Promise<Business> {
  const { data, error } = await sb
    .from("businesses")
    .update(patch)
    .eq("id", businessId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
