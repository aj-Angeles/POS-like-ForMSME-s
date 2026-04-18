"use client";

import { useState } from "react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReconciliation, useReconciliations } from "@/hooks/use-inventory";
import { useProducts } from "@/hooks/use-products";
import { formatNumber } from "@/lib/utils";

export function ReconciliationHistory() {
  const { data, loading } = useReconciliations();
  const [openId, setOpenId] = useState<string | null>(null);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!data || data.length === 0) {
    return <Empty title="No reconciliations yet" description="Create one from the New count tab." />;
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((s) => (
              <TableRow
                key={s.id}
                onClick={() => setOpenId(s.id)}
                className="cursor-pointer"
              >
                <TableCell className="font-mono text-xs">{s.ref_no}</TableCell>
                <TableCell>{format(new Date(s.created_at), "PPpp")}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.note ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SnapshotDialog snapshotId={openId} onOpenChange={(v) => !v && setOpenId(null)} />
    </>
  );
}

function SnapshotDialog({
  snapshotId,
  onOpenChange,
}: {
  snapshotId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, loading } = useReconciliation(snapshotId);
  const products = useProducts();
  const nameOf = (id: string) =>
    (products.data ?? []).find((p) => p.id === id)?.name ?? id.slice(0, 8);

  return (
    <Dialog open={!!snapshotId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{data?.ref_no ?? "Snapshot"}</DialogTitle>
        </DialogHeader>
        {loading || !data ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.reconciliation_items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{nameOf(i.product_id)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(i.expected_qty, 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(i.actual_qty, 0)}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${
                      (i.variance ?? 0) < 0
                        ? "text-destructive"
                        : (i.variance ?? 0) > 0
                          ? "text-warning"
                          : ""
                    }`}
                  >
                    {(i.variance ?? 0) > 0 ? "+" : ""}
                    {formatNumber(i.variance ?? 0, 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
