"use client";

import { useCallback } from "react";

import { expenseService } from "@/lib/services";
import type { ExpenseCategory, ExpenseWithCategory } from "@/lib/types";
import { useSession } from "@/stores/session-store";

import { useAsync } from "./use-async";
import { useSupabase } from "./use-supabase";

export function useExpenses(opts?: { from?: string; to?: string; categoryId?: string }) {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);

  return useAsync<ExpenseWithCategory[]>(async () => {
    if (!businessId) return [];
    return expenseService.listExpenses(sb, businessId, opts);
  }, [businessId, opts?.from, opts?.to, opts?.categoryId]);
}

export function useExpenseCategories() {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);

  return useAsync<ExpenseCategory[]>(async () => {
    if (!businessId) return [];
    return expenseService.listExpenseCategories(sb, businessId);
  }, [businessId]);
}

export function useExpenseMutations() {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);

  const create = useCallback(
    async (input: Parameters<typeof expenseService.createExpense>[2]) => {
      if (!businessId) throw new Error("No active business");
      return expenseService.createExpense(sb, businessId, input);
    },
    [sb, businessId],
  );

  const remove = useCallback(async (id: string) => expenseService.deleteExpense(sb, id), [sb]);

  const createCategory = useCallback(
    async (name: string) => {
      if (!businessId) throw new Error("No active business");
      return expenseService.createExpenseCategory(sb, businessId, name);
    },
    [sb, businessId],
  );

  const deleteCategory = useCallback(
    async (id: string) => expenseService.deleteExpenseCategory(sb, id),
    [sb],
  );

  return { create, remove, createCategory, deleteCategory };
}
