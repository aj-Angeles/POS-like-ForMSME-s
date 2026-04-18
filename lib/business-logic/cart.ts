import type { CartItem } from "../types";

/**
 * Pure functions that power the POS cart. Zero dependencies on Supabase or
 * React so we can unit-test them and call them from anywhere.
 */

export type CartDiscount = { type: "amount" | "percent"; value: number };

export function lineSubtotal(item: CartItem): number {
  return round2(item.quantity * item.unit_price);
}

export function lineTotal(item: CartItem): number {
  return round2(lineSubtotal(item) - item.line_discount);
}

export function cartGross(items: CartItem[]): number {
  return round2(items.reduce((sum, i) => sum + lineSubtotal(i), 0));
}

export function cartLineDiscountTotal(items: CartItem[]): number {
  return round2(items.reduce((sum, i) => sum + i.line_discount, 0));
}

export function applyCartDiscount(gross: number, discount: CartDiscount): number {
  if (!discount.value || discount.value <= 0) return 0;
  if (discount.type === "percent") {
    return round2((gross * Math.min(discount.value, 100)) / 100);
  }
  return round2(Math.min(discount.value, gross));
}

export function cartNet(items: CartItem[], discount: CartDiscount): number {
  const gross = cartGross(items);
  const lineDiscounts = cartLineDiscountTotal(items);
  const cartDiscount = applyCartDiscount(gross - lineDiscounts, discount);
  return round2(Math.max(0, gross - lineDiscounts - cartDiscount));
}

export function computeChange(net: number, tendered: number | null | undefined): number | null {
  if (tendered == null || Number.isNaN(tendered)) return null;
  return round2(tendered - net);
}

export function canCheckout(items: CartItem[], net: number, tendered: number | null, isCash: boolean): boolean {
  if (items.length === 0) return false;
  if (net < 0) return false;
  for (const i of items) {
    if (i.quantity <= 0) return false;
  }
  if (isCash && (tendered == null || tendered < net)) return false;
  return true;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
