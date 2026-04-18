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
import { Textarea } from "@/components/ui/textarea";
import { useAdjustStock } from "@/hooks/use-inventory";
import type { MovementSource, Product } from "@/lib/types";

export function AdjustStockDialog({
  product,
  open,
  onOpenChange,
  onSaved,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const adjust = useAdjustStock();
  const [type, setType] = useState<"add" | "remove">("add");
  const [source, setSource] = useState<MovementSource>("restock");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType("add");
      setSource("restock");
      setQty("");
      setReason("");
      setErr(null);
    }
  }, [open]);

  async function save() {
    if (!product) return;
    setErr(null);
    setSaving(true);
    try {
      const n = parseFloat(qty) || 0;
      const delta = type === "add" ? n : -n;
      await adjust({
        productId: product.id,
        delta,
        reason: reason.trim() || (type === "add" ? "restock" : "adjustment"),
        sourceType: source,
      });
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
          <DialogTitle>Adjust stock — {product?.name}</DialogTitle>
          <DialogDescription>
            Current stock: {product?.stock ?? 0} {product?.unit}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={type} onValueChange={(v) => setType(v as "add" | "remove")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add stock</SelectItem>
                  <SelectItem value="remove">Remove stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason tag</Label>
              <Select value={source} onValueChange={(v) => setSource(v as MovementSource)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="initial">Initial count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rs">Note (optional)</Label>
            <Textarea
              id="rs"
              value={reason}
              rows={2}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. delivery from supplier, damaged item, counting correction"
            />
          </div>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !qty.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
