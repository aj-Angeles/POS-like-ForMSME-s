"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { CartPanel } from "@/components/pos/cart-panel";
import { CheckoutDialog } from "@/components/pos/checkout-dialog";
import { ProductGrid } from "@/components/pos/product-grid";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { useProductCategories, useProducts } from "@/hooks/use-products";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [completed, setCompleted] = useState<Transaction | null>(null);

  const products = useProducts({ search, categoryId, activeOnly: true });
  const categories = useProductCategories();
  const active = useMemo(
    () => (products.data ?? []).filter((p) => p.is_active),
    [products.data],
  );

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1fr_380px]">
      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products or SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto">
            <CategoryChip
              active={!categoryId}
              onClick={() => setCategoryId(undefined)}
              label="All"
            />
            {(categories.data ?? []).map((c) => (
              <CategoryChip
                key={c.id}
                active={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
                label={c.name}
              />
            ))}
          </div>
        </div>

        {products.loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <Empty
            title="No products yet"
            description="Add products from the Products page to start selling."
          />
        ) : (
          <ProductGrid products={active} />
        )}
      </section>

      <CartPanel onCheckout={() => setCheckoutOpen(true)} />

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onSuccess={(tx) => {
          setCheckoutOpen(false);
          setCompleted(tx);
          void products.refetch();
        }}
      />
      <ReceiptDialog
        transactionId={completed?.id ?? null}
        open={!!completed}
        onOpenChange={(v) => !v && setCompleted(null)}
      />
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
