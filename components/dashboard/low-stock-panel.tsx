"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { lowStockProducts } from "@/lib/business-logic/inventory";
import type { Product } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function LowStockPanel({
  products,
  loading,
}: {
  products: Product[];
  loading?: boolean;
}) {
  const low = lowStockProducts(products);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Low-stock alerts
        </CardTitle>
        <Link className="text-xs text-primary hover:underline" href="/inventory">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
        ) : low.length === 0 ? (
          <Empty title="All stocked up" description="No products are below threshold." />
        ) : (
          low.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border p-2 text-sm"
            >
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  Threshold: {formatNumber(p.low_stock_threshold, 0)} {p.unit}
                </div>
              </div>
              <Badge variant={p.stock <= 0 ? "destructive" : "warning"}>
                {formatNumber(p.stock, 0)} {p.unit}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
