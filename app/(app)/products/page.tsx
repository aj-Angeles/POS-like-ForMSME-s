"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";

import { ProductDialog } from "@/components/inventory/product-dialog";
import { CategoryManagerDialog } from "@/components/inventory/category-manager-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductMutations, useProducts } from "@/hooks/use-products";
import type { Product, ProductWithCategory } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const { data, loading, refetch } = useProducts({ search });
  const { remove } = useProductMutations();
  const symbol = useSession((s) => s.business?.currency_symbol) ?? "₱";

  async function onDelete(p: Product) {
    if (!confirm(`Archive ${p.name}? This hides it from the POS but keeps its history.`)) return;
    await remove(p.id);
    await refetch();
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your catalog, prices, and stock thresholds.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatOpen(true)}>
            <Tag className="mr-1 h-4 w-4" />
            Categories
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add product
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (data?.length ?? 0) === 0 ? (
        <Empty
          title="No products yet"
          description="Create your first product to start selling."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add product
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data as ProductWithCategory[]).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    {!p.is_active ? (
                      <Badge variant="outline" className="mt-1 text-xs">
                        archived
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.product_categories?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(p.price, symbol)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatMoney(p.cost, symbol)}
                  </TableCell>
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
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit"
                      onClick={() => {
                        setEditing(p);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Archive"
                      onClick={() => onDelete(p)}
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

      <ProductDialog
        open={open}
        onOpenChange={setOpen}
        product={editing}
        onSaved={() => refetch()}
      />
      <CategoryManagerDialog open={catOpen} onOpenChange={setCatOpen} />
    </div>
  );
}
