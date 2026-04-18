"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProductCategories, useProductMutations } from "@/hooks/use-products";

export function CategoryManagerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, refetch } = useProductCategories();
  const { createCategory, deleteCategory } = useProductMutations();
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    setErr(null);
    if (!name.trim()) return;
    try {
      await createCategory(name.trim());
      setName("");
      await refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }
  async function del(id: string) {
    try {
      await deleteCategory(id);
      await refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Product categories</DialogTitle>
          <DialogDescription>
            Categories help you filter products on the POS screen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button onClick={add} disabled={!name.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 space-y-1 max-h-64 overflow-auto">
          {(data ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span>{c.name}</span>
              <Button variant="ghost" size="icon" onClick={() => del(c.id)} aria-label="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        {err ? <p className="text-sm text-destructive">{err}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
