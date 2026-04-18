"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/lib/utils";
import { useCart } from "@/stores/cart-store";
import { useSession } from "@/stores/session-store";

export function CartPanel({ onCheckout }: { onCheckout: () => void }) {
  const items = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const remove = useCart((s) => s.remove);
  const setLineDiscount = useCart((s) => s.setLineDiscount);
  const clear = useCart((s) => s.clear);
  const discount = useCart((s) => s.discount);
  const setDiscount = useCart((s) => s.setDiscount);
  const gross = useCart((s) => s.gross());
  const net = useCart((s) => s.net());
  const cartDiscountApplied = useCart((s) => s.cartDiscountApplied());
  const lineDiscountTotal = useCart((s) => s.lineDiscountTotal());
  const symbol = useSession((s) => s.business?.currency_symbol) ?? "₱";

  return (
    <aside className="lg:sticky lg:top-0 lg:h-fit">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShoppingBag className="h-4 w-4" />
            Cart ({items.length})
          </CardTitle>
          {items.length > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clear}
              className="text-destructive hover:text-destructive"
            >
              Clear
            </Button>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Tap a product to add it
            </div>
          ) : (
            items.map((i) => (
              <div key={i.product_id} className="rounded-md border p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatMoney(i.unit_price, symbol)} / {i.unit}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    aria-label="Remove"
                    onClick={() => remove(i.product_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center rounded-md border">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => updateQty(i.product_id, i.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      className="h-8 w-14 border-none text-center"
                      inputMode="decimal"
                      value={i.quantity}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        updateQty(i.product_id, Number.isFinite(n) ? n : 0);
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={i.quantity >= i.stock_on_hand}
                      onClick={() => updateQty(i.product_id, i.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    className="h-8 flex-1 text-xs"
                    inputMode="decimal"
                    placeholder="Line disc."
                    value={i.line_discount || ""}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      setLineDiscount(i.product_id, Number.isFinite(n) ? n : 0);
                    }}
                  />
                  <div className="ml-auto text-sm font-semibold tabular-nums">
                    {formatMoney(i.quantity * i.unit_price - i.line_discount, symbol)}
                  </div>
                </div>
              </div>
            ))
          )}

          {items.length > 0 ? (
            <>
              <Separator />
              <div className="space-y-1 text-sm">
                <Row label="Subtotal" value={formatMoney(gross, symbol)} />
                {lineDiscountTotal > 0 ? (
                  <Row
                    label="Line discounts"
                    value={`− ${formatMoney(lineDiscountTotal, symbol)}`}
                  />
                ) : null}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Cart discount</span>
                  <select
                    aria-label="Discount type"
                    value={discount.type}
                    onChange={(e) =>
                      setDiscount({
                        type: e.target.value as "amount" | "percent",
                        value: discount.value,
                      })
                    }
                    className="ml-auto h-8 rounded-md border bg-background px-2 text-xs"
                  >
                    <option value="amount">{symbol}</option>
                    <option value="percent">%</option>
                  </select>
                  <Input
                    className="h-8 w-20"
                    inputMode="decimal"
                    value={discount.value || ""}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      setDiscount({
                        type: discount.type,
                        value: Number.isFinite(n) ? n : 0,
                      });
                    }}
                  />
                </div>
                {cartDiscountApplied > 0 ? (
                  <Row
                    label="Cart discount"
                    value={`− ${formatMoney(cartDiscountApplied, symbol)}`}
                  />
                ) : null}
                <Separator />
                <Row
                  label={<span className="text-base font-semibold">Total</span>}
                  value={
                    <span className="text-base font-semibold text-primary">
                      {formatMoney(net, symbol)}
                    </span>
                  }
                />
              </div>
              <Button className="mt-2 w-full" size="lg" onClick={onCheckout}>
                Checkout {formatMoney(net, symbol)}
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </aside>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
