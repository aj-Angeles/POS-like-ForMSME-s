/**
 * Excel/CSV exports with SheetJS. Each exporter generates a single-sheet
 * workbook with a header row (business name + generated timestamp) and then
 * the data table. Trigger download in the browser via XLSX.writeFile.
 *
 * Accountant-ready: column names match the MD spec.
 */
import * as XLSX from "xlsx";
import { format } from "date-fns";

import type {
  ExpenseWithCategory,
  Product,
  TransactionWithItems,
} from "../types";
import { computeCOGS } from "../business-logic/inventory";
import { summarize } from "../business-logic/analytics";

type Row = Record<string, string | number>;

function sheetWithHeader(title: string, subtitle: string, rows: Row[]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([[title], [subtitle], []]);
  XLSX.utils.sheet_add_json(ws, rows, { origin: "A4" });
  return ws;
}

export function exportTransactionsXLSX(
  businessName: string,
  transactions: TransactionWithItems[],
  symbol: string,
  filename = "transactions.xlsx",
) {
  const rows: Row[] = transactions.map((t) => ({
    "Ref No.": t.ref_no,
    Date: format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
    Cashier: t.cashier_id ?? "",
    Items: (t.transaction_items ?? [])
      .map((i) => `${i.product_name} x${i.quantity}`)
      .join("; "),
    "Payment Method": t.payment_method,
    "External Ref": t.external_ref ?? "",
    "Destination Account": t.destination_account ?? "",
    Discount: t.discount_amount,
    [`Gross Total (${symbol})`]: t.gross_total,
    [`Net Total (${symbol})`]: t.net_total,
  }));
  const ws = sheetWithHeader(
    `${businessName} — Sales Export`,
    `Generated ${format(new Date(), "PPpp")}`,
    rows,
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales");
  XLSX.writeFile(wb, filename);
}

export function exportExpensesXLSX(
  businessName: string,
  expenses: ExpenseWithCategory[],
  symbol: string,
  filename = "expenses.xlsx",
) {
  const rows: Row[] = expenses.map((e) => ({
    "Ref No.": e.ref_no,
    Date: e.expense_date,
    Category: e.expense_categories?.name ?? "",
    [`Amount (${symbol})`]: e.amount,
    "External Ref": e.external_ref ?? "",
    Note: e.note ?? "",
  }));
  const ws = sheetWithHeader(
    `${businessName} — Expenses Export`,
    `Generated ${format(new Date(), "PPpp")}`,
    rows,
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  XLSX.writeFile(wb, filename);
}

export function exportInventorySnapshotXLSX(
  businessName: string,
  products: Product[],
  symbol: string,
  filename = "inventory-snapshot.xlsx",
) {
  const rows: Row[] = products.map((p) => ({
    Name: p.name,
    SKU: p.sku,
    Unit: p.unit,
    [`Cost (${symbol})`]: p.cost,
    [`Price (${symbol})`]: p.price,
    "Current Stock": p.stock,
    "Low-stock threshold": p.low_stock_threshold,
    [`Stock value (${symbol})`]: p.stock * p.cost,
  }));
  const ws = sheetWithHeader(
    `${businessName} — Inventory Snapshot`,
    `Generated ${format(new Date(), "PPpp")}`,
    rows,
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  XLSX.writeFile(wb, filename);
}

export function exportFinancialSummaryXLSX(
  businessName: string,
  transactions: TransactionWithItems[],
  expenses: ExpenseWithCategory[],
  symbol: string,
  rangeLabel: string,
  filename = "financial-summary.xlsx",
) {
  const s = summarize(transactions, expenses);
  const cogs = transactions.reduce(
    (sum, t) => sum + computeCOGS(t.transaction_items ?? []),
    0,
  );
  const rows: Row[] = [
    { Metric: `Gross income (${symbol})`, Value: s.gross_sales },
    { Metric: `COGS (${symbol})`, Value: cogs },
    { Metric: `Gross profit (${symbol})`, Value: s.gross_sales - cogs },
    { Metric: `Total expenses (${symbol})`, Value: s.expenses_total },
    { Metric: `Net income (${symbol})`, Value: s.gross_sales - s.expenses_total },
    { Metric: "Transactions", Value: s.transaction_count },
    { Metric: `Average order value (${symbol})`, Value: s.average_order_value },
  ];
  const ws = sheetWithHeader(
    `${businessName} — Financial Summary`,
    `${rangeLabel} · Generated ${format(new Date(), "PPpp")}`,
    rows,
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Summary");
  XLSX.writeFile(wb, filename);
}
