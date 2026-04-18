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
import { useExpenseCategories, useExpenseMutations } from "@/hooks/use-expenses";
import { toISODate } from "@/lib/business-logic/dates";

export function ExpenseDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const cats = useExpenseCategories();
  const { create } = useExpenseMutations();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(toISODate(new Date()));
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setCategory(cats.data?.[0]?.id);
      setDate(toISODate(new Date()));
      setRef("");
      setNote("");
      setErr(null);
    }
  }, [open, cats.data]);

  async function save() {
    setErr(null);
    setSaving(true);
    try {
      const n = parseFloat(amount);
      if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a valid amount.");
      await create({
        amount: n,
        category_id: category ?? null,
        external_ref: ref || undefined,
        note: note || undefined,
        expense_date: date,
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
          <DialogTitle>Add expense</DialogTitle>
          <DialogDescription>
            External refs are for supplier invoices or BIR receipts — searchable and exportable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amt">Amount</Label>
              <Input
                id="amt"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dt">Date</Label>
              <Input
                id="dt"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category ?? ""} onValueChange={(v) => setCategory(v || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Uncategorized" />
              </SelectTrigger>
              <SelectContent>
                {(cats.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="xref">External reference (optional)</Label>
            <Input
              id="xref"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. Supplier invoice #1234 or BIR OR 00012345"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
