"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
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
import { useStockMovements } from "@/hooks/use-inventory";
import { useProducts } from "@/hooks/use-products";
import { formatNumber } from "@/lib/utils";

export default function MovementsPage() {
  const { data, loading } = useStockMovements({ limit: 500 });
  const products = useProducts();
  const nameOf = (id: string) =>
    (products.data ?? []).find((p) => p.id === id)?.name ?? id.slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock movements</h1>
        <p className="text-sm text-muted-foreground">
          Every stock change: sales, adjustments, restocks, initial counts.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (data ?? []).length === 0 ? (
        <Empty title="No movements yet" description="Sales and adjustments appear here." />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Delta</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(m.created_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell>{nameOf(m.product_id)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {m.source_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={m.delta < 0 ? "text-destructive" : "text-success"}>
                      {m.delta > 0 ? "+" : ""}
                      {formatNumber(m.delta, 0)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{m.ref_no ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.reason ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
