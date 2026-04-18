import type {
  MovementSource,
  ReconciliationItem,
  ReconciliationSnapshot,
  StockMovement,
} from "../types";
import type { SB } from "./types";

export async function listStockMovements(
  sb: SB,
  businessId: string,
  opts?: { productId?: string; limit?: number },
): Promise<StockMovement[]> {
  let q = sb
    .from("stock_movements")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 200);
  if (opts?.productId) q = q.eq("product_id", opts.productId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function adjustStock(
  sb: SB,
  input: {
    businessId: string;
    productId: string;
    delta: number;
    reason: string;
    sourceType: MovementSource;
  },
): Promise<StockMovement> {
  const { data, error } = await sb.rpc("adjust_stock", {
    p_business_id: input.businessId,
    p_product_id: input.productId,
    p_delta: input.delta,
    p_reason: input.reason,
    p_source_type: input.sourceType,
  });
  if (error) throw error;
  return data as unknown as StockMovement;
}

/** Reconciliation */
export async function createReconciliation(
  sb: SB,
  input: {
    businessId: string;
    note?: string;
    counts: { product_id: string; actual_qty: number; note?: string }[];
  },
): Promise<ReconciliationSnapshot> {
  const { data, error } = await sb.rpc("create_reconciliation", {
    p_business_id: input.businessId,
    p_note: input.note ?? "",
    p_counts: input.counts as unknown as never,
  });
  if (error) throw error;
  return data as unknown as ReconciliationSnapshot;
}

export async function listReconciliations(
  sb: SB,
  businessId: string,
): Promise<ReconciliationSnapshot[]> {
  const { data, error } = await sb
    .from("reconciliation_snapshots")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getReconciliation(
  sb: SB,
  snapshotId: string,
): Promise<(ReconciliationSnapshot & { reconciliation_items: ReconciliationItem[] }) | null> {
  const { data, error } = await sb
    .from("reconciliation_snapshots")
    .select("*, reconciliation_items(*)")
    .eq("id", snapshotId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as
    | (ReconciliationSnapshot & { reconciliation_items: ReconciliationItem[] })
    | null;
}
