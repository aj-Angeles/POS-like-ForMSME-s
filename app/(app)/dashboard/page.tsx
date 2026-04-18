"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Receipt, TrendingUp, Wallet } from "lucide-react";

import { DashboardCharts } from "@/components/dashboard/charts";
import { LowStockPanel } from "@/components/dashboard/low-stock-panel";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/hooks/use-expenses";
import { useProducts } from "@/hooks/use-products";
import { useTransactions } from "@/hooks/use-transactions";
import { rangeForPeriod, toISODate } from "@/lib/business-logic/dates";
import type { Period } from "@/lib/types";
import { cn } from "@/lib/utils";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("today");

  const range = useMemo(() => rangeForPeriod(period), [period]);
  const from = range.from.toISOString();
  const to = range.to.toISOString();

  const txs = useTransactions({ from, to, withItems: true, limit: 500 });
  const exps = useExpenses({ from: toISODate(range.from), to: toISODate(range.to) });
  const products = useProducts({ activeOnly: true });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your business at a glance.</p>
        </div>
        <div className="flex rounded-md border bg-card p-0.5">
          {PERIODS.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant="ghost"
              className={cn(
                "rounded-sm",
                period === p.id && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <SummaryCards
        transactions={txs.data ?? []}
        expenses={exps.data ?? []}
        loading={txs.loading || exps.loading}
      />

      <DashboardCharts
        transactions={txs.data ?? []}
        expenses={exps.data ?? []}
        loading={txs.loading || exps.loading}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <LowStockPanel products={products.data ?? []} loading={products.loading} />
        <RecentTransactions transactions={txs.data ?? []} loading={txs.loading} />
      </div>
    </div>
  );
}

// Re-export icons so tree-shaking picks them up (unused guards silenced).
void [Wallet, Receipt, TrendingUp, AlertTriangle];
