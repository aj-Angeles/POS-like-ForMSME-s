import type { CartItem, PaymentMethod, Transaction, TransactionWithItems } from "../types";
import type { SB } from "./types";

export type CreateSaleInput = {
  businessId: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  externalRef?: string;
  destinationAccount?: string;
  amountTendered?: number | null;
  discountAmount: number;
  discountType: "amount" | "percent";
  grossTotal: number;
  netTotal: number;
  notes?: string;
};

/**
 * Create a sale atomically. Uses the create_sale RPC (see 0003_functions.sql)
 * which generates the reference number, deducts stock, logs movements, and
 * returns the transaction row.
 */
export async function createSale(sb: SB, input: CreateSaleInput): Promise<Transaction> {
  const { data, error } = await sb.rpc("create_sale", {
    p_business_id: input.businessId,
    p_payment_method: input.paymentMethod,
    p_external_ref: input.externalRef ?? "",
    p_destination_account: input.destinationAccount ?? "",
    p_amount_tendered: input.amountTendered ?? (null as unknown as number),
    p_discount_amount: input.discountAmount,
    p_discount_type: input.discountType,
    p_gross_total: input.grossTotal,
    p_net_total: input.netTotal,
    p_notes: input.notes ?? "",
    p_items: input.items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      line_discount: i.line_discount,
    })) as unknown as never,
  });
  if (error) throw error;
  return data as unknown as Transaction;
}

export async function listTransactions(
  sb: SB,
  businessId: string,
  opts?: {
    from?: string;
    to?: string;
    paymentMethod?: PaymentMethod;
    cashierId?: string;
    search?: string;
    limit?: number;
    withItems?: boolean;
  },
): Promise<TransactionWithItems[]> {
  const selectCols = opts?.withItems ? "*, transaction_items(*)" : "*";
  let q = sb
    .from("transactions")
    .select(selectCols)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 200);
  if (opts?.from) q = q.gte("created_at", opts.from);
  if (opts?.to) q = q.lte("created_at", opts.to);
  if (opts?.paymentMethod) q = q.eq("payment_method", opts.paymentMethod);
  if (opts?.cashierId) q = q.eq("cashier_id", opts.cashierId);
  if (opts?.search && opts.search.trim()) {
    q = q.or(`ref_no.ilike.%${opts.search}%,external_ref.ilike.%${opts.search}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as TransactionWithItems[];
}

export async function getTransaction(
  sb: SB,
  id: string,
): Promise<TransactionWithItems | null> {
  const { data, error } = await sb
    .from("transactions")
    .select("*, transaction_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as TransactionWithItems | null;
}
