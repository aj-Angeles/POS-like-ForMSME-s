"use client";

import { useCallback } from "react";

import { transactionService } from "@/lib/services";
import type { PaymentMethod, TransactionWithItems } from "@/lib/types";
import { useSession } from "@/stores/session-store";

import { useAsync } from "./use-async";
import { useSupabase } from "./use-supabase";

export function useTransactions(opts?: {
  from?: string;
  to?: string;
  paymentMethod?: PaymentMethod;
  cashierId?: string;
  search?: string;
  withItems?: boolean;
  limit?: number;
}) {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);

  return useAsync<TransactionWithItems[]>(async () => {
    if (!businessId) return [];
    return transactionService.listTransactions(sb, businessId, opts);
  }, [
    businessId,
    opts?.from,
    opts?.to,
    opts?.paymentMethod,
    opts?.cashierId,
    opts?.search,
    opts?.withItems,
    opts?.limit,
  ]);
}

export function useCreateSale() {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);

  return useCallback(
    async (input: Omit<Parameters<typeof transactionService.createSale>[1], "businessId">) => {
      if (!businessId) throw new Error("No active business");
      return transactionService.createSale(sb, { ...input, businessId });
    },
    [sb, businessId],
  );
}

export function useTransaction(id: string | null) {
  const sb = useSupabase();

  return useAsync<TransactionWithItems | null>(async () => {
    if (!id) return null;
    return transactionService.getTransaction(sb, id);
  }, [id]);
}
