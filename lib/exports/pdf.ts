/**
 * PDF receipt/report generator using jsPDF + autoTable. Designed for
 * printer-friendly receipts and simple tabular reports.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

import type { TransactionWithItems } from "../types";

export function exportReceiptPDF(
  businessName: string,
  txn: TransactionWithItems,
  symbol: string,
) {
  const doc = new jsPDF({ unit: "pt", format: "a6" });
  doc.setFontSize(14);
  doc.text(businessName, 20, 30);
  doc.setFontSize(9);
  doc.text(`Ref: ${txn.ref_no}`, 20, 46);
  doc.text(format(new Date(txn.created_at), "PPpp"), 20, 58);

  autoTable(doc, {
    startY: 70,
    head: [["Item", "Qty", "Price", "Total"]],
    body: (txn.transaction_items ?? []).map((i) => [
      i.product_name,
      String(i.quantity),
      `${symbol}${Number(i.unit_price).toFixed(2)}`,
      `${symbol}${(Number(i.unit_price) * Number(i.quantity)).toFixed(2)}`,
    ]),
    theme: "plain",
    styles: { fontSize: 8 },
  });

  const afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.text(`Subtotal: ${symbol}${txn.gross_total.toFixed(2)}`, 20, afterY);
  doc.text(`Discount: ${symbol}${txn.discount_amount.toFixed(2)}`, 20, afterY + 12);
  doc.setFontSize(11);
  doc.text(`Total:    ${symbol}${txn.net_total.toFixed(2)}`, 20, afterY + 28);
  doc.setFontSize(9);
  doc.text(`Payment: ${txn.payment_method}`, 20, afterY + 44);
  if (txn.external_ref) doc.text(`External ref: ${txn.external_ref}`, 20, afterY + 56);

  doc.save(`receipt-${txn.ref_no}.pdf`);
}

export function exportFinancialSummaryPDF(
  businessName: string,
  rows: { metric: string; value: string }[],
  rangeLabel: string,
  filename = "financial-summary.pdf",
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(16);
  doc.text(`${businessName} — Financial Summary`, 40, 40);
  doc.setFontSize(10);
  doc.text(rangeLabel, 40, 58);
  doc.text(`Generated ${format(new Date(), "PPpp")}`, 40, 72);
  autoTable(doc, {
    startY: 90,
    head: [["Metric", "Value"]],
    body: rows.map((r) => [r.metric, r.value]),
    theme: "grid",
    styles: { fontSize: 10 },
  });
  doc.save(filename);
}
