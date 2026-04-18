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
import { useExpenseCategories, useExpenseMutations } from "@/hooks/use-expenses";

export function CategoryDialogExpenses({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, refetch } = useExpenseCategories();
  const { createCategory, deleteCategory } = useExpenseMutations();
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    await createCategory(name.trim());
    setName("");
    await refetch();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Expense categories</DialogTitle>
          <DialogDescription>Customize to match your business bookkeeping.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="New category"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button onClick={add} disabled={!name.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 max-h-64 space-y-1 overflow-auto">
          {(data ?? []).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-md border p-2 text-sm"
            >
              <span>{c.name}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                onClick={async () => {
                  await deleteCategory(c.id);
                  await refetch();
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
