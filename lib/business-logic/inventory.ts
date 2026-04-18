import type { Product, TransactionItem } from "../types";

/** Current inventory value = Σ cost × stock */
export function inventoryValue(products: Product[]): number {
  return round2(products.reduce((sum, p) => sum + p.cost * p.stock, 0));
}

/** Retail value = Σ price × stock (useful for expected revenue snapshots) */
export function inventoryRetailValue(products: Product[]): number {
  return round2(products.reduce((sum, p) => sum + p.price * p.stock, 0));
}

export function lowStockProducts(products: Product[]): Product[] {
  return products.filter((p) => p.is_active && p.stock <= p.low_stock_threshold);
}

/** COGS for a given set of transaction items = Σ quantity × unit_cost */
export function computeCOGS(items: Pick<TransactionItem, "quantity" | "unit_cost">[]): number {
  return round2(items.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0));
}

/** Expected stock derived from baseline + deltas in a movements list. */
export function expectedStock(
  baseline: number,
  deltas: { delta: number }[],
): number {
  return round2(deltas.reduce((acc, m) => acc + m.delta, baseline));
}

/**
 * Variance = actual − expected.
 * Negative = shrinkage (shortage)
 * Positive = unrecorded restock or miscount
 */
export function variance(expected: number, actual: number): number {
  return round2(actual - expected);
}

export function isVarianceFlagged(v: number, threshold: number): boolean {
  return Math.abs(v) >= threshold;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
