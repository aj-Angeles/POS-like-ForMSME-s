"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

export function RecentTransactions({
  transactions,
  loading,
  limit = 6,
}: {
  transactions: Transaction[];
  loading?: boolean;
  limit?: number;
}) {
  const symbol = useSession((s) => s.business?.currency_symbol) ?? "₱";
  const rows = transactions.slice(0, limit);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Receipt className="h-4 w-4" />
          Recent transactions
        </CardTitle>
        <Link className="text-xs text-primary hover:underline" href="/transactions">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
        ) : rows.length === 0 ? (
          <Empty title="No sales yet" description="Start a sale from the POS screen." />
        ) : (
          rows.map((t) => (
            <Link
              key={t.id}
              href={`/transactions?ref=${encodeURIComponent(t.ref_no)}`}
              className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-muted/40"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{t.ref_no}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(t.created_at), "MMM d, HH:mm")} ·{" "}
                  <span className="capitalize">{t.payment_method.replace("_", " ")}</span>
                </div>
              </div>
              <Badge variant="outline">{formatMoney(t.net_total, symbol)}</Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
