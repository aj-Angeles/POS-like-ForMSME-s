"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, Search } from "lucide-react";

import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTransactions } from "@/hooks/use-transactions";
import { exportTransactionsXLSX } from "@/lib/exports/xlsx";
import type { PaymentMethod } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useSession } from "@/stores/session-store";
import { rangeForPeriod } from "@/lib/business-logic/dates";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("today");
  const [open, setOpen] = useState<string | null>(null);

  const range = useMemo(() => (period === "all" ? null : rangeForPeriod(period)), [period]);
  const business = useSession((s) => s.business);
  const symbol = business?.currency_symbol ?? "₱";

  const { data, loading } = useTransactions({
    from: range?.from.toISOString(),
    to: range?.to.toISOString(),
    paymentMethod: method === "all" ? undefined : method,
    search,
    withItems: true,
    limit: 500,
  });

  async function exportNow() {
    if (!data) return;
    const label = range
      ? `${format(range.from, "yyyy-MM-dd")}_to_${format(range.to, "yyyy-MM-dd")}`
      : "all";
    exportTransactionsXLSX(
      business?.name ?? "Business",
      data,
      symbol,
      `transactions_${label}.xlsx`,
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">Sales history with filters and export.</p>
        </div>
        <Button variant="outline" onClick={exportNow} disabled={!data?.length}>
          <Download className="mr-1 h-4 w-4" />
          Export XLSX
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by ref no. or external ref"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="gcash">GCash</SelectItem>
            <SelectItem value="maya">Maya</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.length === 0 ? (
        <Empty title="No transactions" description="Try a different filter or process a sale." />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>External ref</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => setOpen(t.id)}
                >
                  <TableCell className="font-mono text-xs">{t.ref_no}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(t.created_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {t.payment_method.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{t.external_ref ?? "—"}</TableCell>
                  <TableCell className="text-sm">{t.destination_account ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t.transaction_items?.length ?? 0}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(t.net_total, symbol)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ReceiptDialog
        transactionId={open}
        open={!!open}
        onOpenChange={(v) => !v && setOpen(null)}
      />
    </div>
  );
}
