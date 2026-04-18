"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Download, Plus, Tag, Trash2 } from "lucide-react";

import { CategoryDialogExpenses } from "@/components/expenses/category-dialog";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
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
import { useExpenseMutations, useExpenses } from "@/hooks/use-expenses";
import { rangeForPeriod, toISODate } from "@/lib/business-logic/dates";
import { exportExpensesXLSX } from "@/lib/exports/xlsx";
import { formatMoney } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

export default function ExpensesPage() {
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const { remove } = useExpenseMutations();

  const range = period === "all" ? null : rangeForPeriod(period);
  const business = useSession((s) => s.business);
  const symbol = business?.currency_symbol ?? "₱";

  const { data, loading, refetch } = useExpenses({
    from: range ? toISODate(range.from) : undefined,
    to: range ? toISODate(range.to) : undefined,
  });

  async function onDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await remove(id);
    await refetch();
  }

  async function exportNow() {
    if (!data) return;
    const label = range
      ? `${format(range.from, "yyyy-MM-dd")}_to_${format(range.to, "yyyy-MM-dd")}`
      : "all";
    exportExpensesXLSX(
      business?.name ?? "Business",
      data,
      symbol,
      `expenses_${label}.xlsx`,
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track operating costs by category.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatOpen(true)}>
            <Tag className="mr-1 h-4 w-4" />
            Categories
          </Button>
          <Button variant="outline" onClick={exportNow} disabled={!data?.length}>
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add expense
          </Button>
        </div>
      </div>

      <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This week</SelectItem>
          <SelectItem value="month">This month</SelectItem>
          <SelectItem value="all">All time</SelectItem>
        </SelectContent>
      </Select>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.length === 0 ? (
        <Empty title="No expenses in range" description="Record your first expense to get started." />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>External ref</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.ref_no}</TableCell>
                  <TableCell>{format(new Date(e.expense_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{e.expense_categories?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{e.external_ref ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.note ?? ""}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(e.amount, symbol)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete"
                      onClick={() => onDelete(e.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ExpenseDialog open={open} onOpenChange={setOpen} onSaved={() => refetch()} />
      <CategoryDialogExpenses open={catOpen} onOpenChange={setCatOpen} />
    </div>
  );
}
