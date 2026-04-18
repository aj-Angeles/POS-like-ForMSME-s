"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductCategories, useProductMutations } from "@/hooks/use-products";
import { UNITS } from "@/lib/constants";
import type { Product } from "@/lib/types";

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSaved: () => void;
}) {
  const cats = useProductCategories();
  const { create, update } = useProductMutations();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [unit, setUnit] = useState("pcs");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(product?.name ?? "");
      setSku(product?.sku ?? "");
      setCategory(product?.category_id ?? undefined);
      setUnit(product?.unit ?? "pcs");
      setPrice(product?.price != null ? String(product.price) : "");
      setCost(product?.cost != null ? String(product.cost) : "");
      setStock(product ? "" : "0");
      setThreshold(product ? String(product.low_stock_threshold) : "5");
      setErr(null);
    }
  }, [open, product]);

  async function save() {
    setErr(null);
    setSaving(true);
    try {
      const p = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        category_id: category ?? null,
        unit,
        price: parseFloat(price) || 0,
        cost: parseFloat(cost) || 0,
        stock: stock === "" ? undefined : parseFloat(stock) || 0,
        low_stock_threshold: parseFloat(threshold) || 0,
      };
      if (product) {
        await update(product.id, {
          name: p.name,
          sku: p.sku ?? product.sku,
          category_id: p.category_id,
          unit: p.unit,
          price: p.price,
          cost: p.cost,
          low_stock_threshold: p.low_stock_threshold,
        });
      } else {
        await create(p);
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Update price, cost, or category. Stock changes go through Inventory."
              : "Cost price is used for COGS and inventory valuation."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (auto if blank)</Label>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category ?? "__none__"} onValueChange={(v) => setCategory(v === "__none__" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Uncategorized" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Uncategorized</SelectItem>
                {(cats.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price">Selling price</Label>
              <Input
                id="price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost price</Label>
              <Input
                id="cost"
                inputMode="decimal"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {!product ? (
              <div className="space-y-2">
                <Label htmlFor="stock">Initial stock</Label>
                <Input
                  id="stock"
                  inputMode="decimal"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="thr">Low-stock threshold</Label>
              <Input
                id="thr"
                inputMode="decimal"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
          </div>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
