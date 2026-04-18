"use client";

import { Button } from "@/components/ui/button";
import type { ProductWithCategory } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/utils";
import { useCart } from "@/stores/cart-store";
import { useSession } from "@/stores/session-store";

export function ProductGrid({ products }: { products: ProductWithCategory[] }) {
  const add = useCart((s) => s.add);
  const symbol = useSession((s) => s.business?.currency_symbol) ?? "₱";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {products.map((p) => {
        const oos = p.stock <= 0;
        return (
          <Button
            key={p.id}
            type="button"
            variant="outline"
            disabled={oos}
            onClick={() =>
              add({
                product_id: p.id,
                name: p.name,
                sku: p.sku,
                unit: p.unit,
                quantity: 1,
                unit_price: p.price,
                unit_cost: p.cost,
                line_discount: 0,
                stock_on_hand: p.stock,
              })
            }
            className="h-auto flex-col items-start justify-start gap-1 whitespace-normal p-3 text-left"
          >
            <div className="line-clamp-2 text-sm font-semibold text-foreground">{p.name}</div>
            <div className="text-xs text-muted-foreground">
              {formatNumber(p.stock, 0)} {p.unit}
              {p.stock <= p.low_stock_threshold && p.stock > 0 ? " · low" : ""}
              {oos ? " · out" : ""}
            </div>
            <div className="mt-auto text-sm font-semibold text-primary">
              {formatMoney(p.price, symbol)}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
