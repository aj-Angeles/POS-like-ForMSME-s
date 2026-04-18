import type { Expense, ExpenseCategory, ExpenseWithCategory } from "../types";
import type { SB } from "./types";

export async function listExpenses(
  sb: SB,
  businessId: string,
  opts?: { from?: string; to?: string; categoryId?: string; limit?: number },
): Promise<ExpenseWithCategory[]> {
  let q = sb
    .from("expenses")
    .select("*, expense_categories(id, name)")
    .eq("business_id", businessId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 500);
  if (opts?.from) q = q.gte("expense_date", opts.from);
  if (opts?.to) q = q.lte("expense_date", opts.to);
  if (opts?.categoryId) q = q.eq("category_id", opts.categoryId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ExpenseWithCategory[];
}

export async function createExpense(
  sb: SB,
  businessId: string,
  input: {
    amount: number;
    category_id?: string | null;
    external_ref?: string;
    note?: string;
    expense_date: string;
  },
): Promise<Expense> {
  const { data: refNo, error: refErr } = await sb.rpc("next_reference_number", {
    p_business_id: businessId,
    p_type: "EXP",
  });
  if (refErr) throw refErr;
  const { data, error } = await sb
    .from("expenses")
    .insert({
      business_id: businessId,
      ref_no: refNo as string,
      amount: input.amount,
      category_id: input.category_id ?? null,
      external_ref: input.external_ref ?? null,
      note: input.note ?? null,
      expense_date: input.expense_date,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function listExpenseCategories(
  sb: SB,
  businessId: string,
): Promise<ExpenseCategory[]> {
  const { data, error } = await sb
    .from("expense_categories")
    .select("*")
    .eq("business_id", businessId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createExpenseCategory(
  sb: SB,
  businessId: string,
  name: string,
): Promise<ExpenseCategory> {
  const { data, error } = await sb
    .from("expense_categories")
    .insert({ business_id: businessId, name })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExpenseCategory(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("expense_categories").delete().eq("id", id);
  if (error) throw error;
}
