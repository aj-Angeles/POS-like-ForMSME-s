"use client";

import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";

import { AdjustStockDialog } from "@/components/inventory/adjust-stock-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/hooks/use-products";
import {
  inventoryRetailValue,
  inventoryValue,
  lowStockProducts,
} from "@/lib/business-logic/inventory";
import type { Product } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/utils";
import { useSession } from "@/stores/session-store";
import Link from "next/link";

export default function InventoryPage() {
  const { data, loading, refetch } = useProducts();
  const symbol = useSession((s) => s.business?.currency_symbol) ?? "₱";
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  const products = data ?? [];
  const cogsValue = inventoryValue(products);
  const retailValue = inventoryRetailValue(products);
  const low = lowStockProducts(products);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Stock levels, valuations, and adjustments.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory/movements">
            <Button variant="outline">Movements</Button>
          </Link>
          <Link href="/inventory/reconcile">
            <Button variant="outline">Reconcile</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Current inventory value (cost)" value={formatMoney(cogsValue, symbol)} />
        <StatCard label="Retail value (price)" value={formatMoney(retailValue, symbol)} />
        <StatCard
          label="Low-stock items"
          value={`${low.length}`}
          tone={low.length > 0 ? "text-warning" : undefined}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {loading ? null : products.length === 0 ? (
        <Empty title="No products in inventory" description="Create products first." />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span
                      className={
                        p.stock <= 0
                          ? "text-destructive"
                          : p.stock <= p.low_stock_threshold
                            ? "text-warning"
                            : ""
                      }
                    >
                      {formatNumber(p.stock, 0)} {p.unit}
                    </span>
                    {p.stock <= p.low_stock_threshold ? (
                      <Badge variant="warning" className="ml-2">
                        low
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {formatNumber(p.low_stock_threshold, 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(p.cost * p.stock, symbol)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setAdjusting(p)}>
                      <Plus className="mr-1 h-3 w-3" />
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdjustStockDialog
        product={adjusting}
        open={!!adjusting}
        onOpenChange={(v) => !v && setAdjusting(null)}
        onSaved={() => refetch()}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
          {label}
          {icon}
        </div>
        <div className={`mt-1 text-2xl font-bold ${tone ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
