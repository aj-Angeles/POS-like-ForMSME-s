"use client";

import { useCallback } from "react";

import { inventoryService } from "@/lib/services";
import type { ReconciliationSnapshot, StockMovement } from "@/lib/types";
import { useSession } from "@/stores/session-store";

import { useAsync } from "./use-async";
import { useSupabase } from "./use-supabase";

export function useStockMovements(opts?: { productId?: string; limit?: number }) {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);
  return useAsync<StockMovement[]>(async () => {
    if (!businessId) return [];
    return inventoryService.listStockMovements(sb, businessId, opts);
  }, [businessId, opts?.productId, opts?.limit]);
}

export function useAdjustStock() {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);

  return useCallback(
    async (input: Omit<Parameters<typeof inventoryService.adjustStock>[1], "businessId">) => {
      if (!businessId) throw new Error("No active business");
      return inventoryService.adjustStock(sb, { ...input, businessId });
    },
    [sb, businessId],
  );
}

export function useReconciliations() {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);
  return useAsync<ReconciliationSnapshot[]>(async () => {
    if (!businessId) return [];
    return inventoryService.listReconciliations(sb, businessId);
  }, [businessId]);
}

export function useReconciliation(id: string | null) {
  const sb = useSupabase();
  return useAsync(async () => {
    if (!id) return null;
    return inventoryService.getReconciliation(sb, id);
  }, [id]);
}

export function useCreateReconciliation() {
  const sb = useSupabase();
  const businessId = useSession((s) => s.business?.id);
  return useCallback(
    async (input: Omit<Parameters<typeof inventoryService.createReconciliation>[1], "businessId">) => {
      if (!businessId) throw new Error("No active business");
      return inventoryService.createReconciliation(sb, { ...input, businessId });
    },
    [sb, businessId],
  );
}
