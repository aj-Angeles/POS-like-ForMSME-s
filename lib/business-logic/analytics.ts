import { format } from "date-fns";

import type {
  DashboardSummary,
  Expense,
  PaymentMethodBreakdown,
  SeriesPoint,
  TopProduct,
  Transaction,
  TransactionItem,
} from "../types";

type TxWithItems = Transaction & { transaction_items?: TransactionItem[] };

export function summarize(transactions: Transaction[], expenses: Expense[]): DashboardSummary {
  const gross = sum(transactions.map((t) => t.net_total));
  const expTotal = sum(expenses.map((e) => e.amount));
  const count = transactions.length;
  return {
    gross_sales: round2(gross),
    expenses_total: round2(expTotal),
    net_income: round2(gross - expTotal),
    transaction_count: count,
    average_order_value: count === 0 ? 0 : round2(gross / count),
  };
}

export function paymentMethodBreakdown(transactions: Transaction[]): PaymentMethodBreakdown[] {
  const map = new Map<string, PaymentMethodBreakdown>();
  for (const t of transactions) {
    const key = t.payment_method;
    const existing = map.get(key) ?? { method: t.payment_method, total: 0, count: 0 };
    existing.total = round2(existing.total + t.net_total);
    existing.count += 1;
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function topProducts(transactions: TxWithItems[], limit = 5): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const t of transactions) {
    for (const it of t.transaction_items ?? []) {
      const existing = map.get(it.product_id) ?? {
        product_id: it.product_id,
        name: it.product_name,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity = round3(existing.quantity + it.quantity);
      existing.revenue = round2(existing.revenue + it.line_total);
      map.set(it.product_id, existing);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function expenseByCategory(
  expenses: (Expense & { expense_categories?: { name: string } | null })[],
): { category: string; total: number }[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const key = e.expense_categories?.name ?? "Uncategorized";
    map.set(key, round2((map.get(key) ?? 0) + e.amount));
  }
  return Array.from(map, ([category, total]) => ({ category, total })).sort(
    (a, b) => b.total - a.total,
  );
}

/** Bucket transactions/expenses into per-day SeriesPoint rows. */
export function dailySeries(
  transactions: TxWithItems[],
  expenses: Expense[],
): SeriesPoint[] {
  const map = new Map<string, SeriesPoint>();
  const key = (d: string | Date) => format(new Date(d), "yyyy-MM-dd");

  for (const t of transactions) {
    const k = key(t.created_at);
    const row = map.get(k) ?? empty(k);
    row.gross = round2(row.gross + t.net_total);
    const cogs = sum((t.transaction_items ?? []).map((i) => i.quantity * i.unit_cost));
    row.cogs = round2(row.cogs + cogs);
    map.set(k, row);
  }
  for (const e of expenses) {
    const k = key(e.expense_date);
    const row = map.get(k) ?? empty(k);
    row.expenses = round2(row.expenses + e.amount);
    map.set(k, row);
  }
  for (const row of map.values()) {
    row.gross_profit = round2(row.gross - row.cogs);
    row.net = round2(row.gross - row.expenses);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function empty(date: string): SeriesPoint {
  return { date, gross: 0, expenses: 0, net: 0, cogs: 0, gross_profit: 0 };
}
function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}
