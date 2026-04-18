"use client";

import { Receipt, TrendingUp, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { summarize } from "@/lib/business-logic/analytics";
import type { Expense, Transaction } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

export function SummaryCards({
  transactions,
  expenses,
  loading,
}: {
  transactions: Transaction[];
  expenses: Expense[];
  loading?: boolean;
}) {
  const symbol = useSession((s) => s.business?.currency_symbol) ?? "₱";
  const s = summarize(transactions, expenses);

  const items = [
    { label: "Gross sales", value: formatMoney(s.gross_sales, symbol), icon: Wallet },
    { label: "Expenses", value: formatMoney(s.expenses_total, symbol), icon: Receipt },
    {
      label: "Net income",
      value: formatMoney(s.net_income, symbol),
      icon: TrendingUp,
      tone: s.net_income >= 0 ? "text-success" : "text-destructive",
    },
    { label: "Transactions", value: formatNumber(s.transaction_count, 0) },
    { label: "Average order value", value: formatMoney(s.average_order_value, symbol) },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
      {items.map((i) => (
        <Card key={i.label}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{i.label}</div>
            <div className={`mt-1 text-2xl font-bold ${i.tone ?? ""}`}>
              {loading ? <Skeleton className="h-7 w-24" /> : i.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
