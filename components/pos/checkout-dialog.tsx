"use client";

import { useMemo, useState } from "react";

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
import { useCreateSale } from "@/hooks/use-transactions";
import { canCheckout } from "@/lib/business-logic/cart";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { PaymentMethod, Transaction } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useCart } from "@/stores/cart-store";
import { useSession } from "@/stores/session-store";

export function CheckoutDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tx: Transaction) => void;
}) {
  const items = useCart((s) => s.items);
  const gross = useCart((s) => s.gross());
  const net = useCart((s) => s.net());
  const discount = useCart((s) => s.discount);
  const paymentMethod = useCart((s) => s.paymentMethod);
  const setPaymentMethod = useCart((s) => s.setPaymentMethod);
  const amountTendered = useCart((s) => s.amountTendered);
  const setTendered = useCart((s) => s.setTendered);
  const externalRef = useCart((s) => s.externalRef);
  const setExternalRef = useCart((s) => s.setExternalRef);
  const destinationAccount = useCart((s) => s.destinationAccount);
  const setDestinationAccount = useCart((s) => s.setDestinationAccount);
  const notes = useCart((s) => s.notes);
  const setNotes = useCart((s) => s.setNotes);
  const change = useCart((s) => s.change());
  const clear = useCart((s) => s.clear);

  const symbol = useSession((s) => s.business?.currency_symbol) ?? "₱";

  const createSale = useCreateSale();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCash = paymentMethod === "cash";
  const methodConfig = PAYMENT_METHODS.find((m) => m.value === paymentMethod)!;
  const allowed = useMemo(
    () => canCheckout(items, net, amountTendered, isCash),
    [items, net, amountTendered, isCash],
  );

  async function onConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      const tx = await createSale({
        items,
        paymentMethod,
        externalRef,
        destinationAccount,
        amountTendered: isCash ? amountTendered : null,
        discountAmount: discount.value || 0,
        discountType: discount.type,
        grossTotal: gross,
        netTotal: net,
        notes,
      });
      clear();
      onSuccess(tx);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Total due:{" "}
            <span className="font-semibold text-primary">{formatMoney(net, symbol)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCash ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tendered">Amount tendered</Label>
                <Input
                  id="tendered"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amountTendered ?? ""}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value);
                    setTendered(Number.isFinite(n) ? n : null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Change due</Label>
                <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm tabular-nums">
                  {change == null ? "—" : formatMoney(change, symbol)}
                </div>
              </div>
            </div>
          ) : methodConfig.requiresExternal ? (
            <div className="space-y-3 rounded-md border border-dashed bg-accent/30 p-3">
              <div className="text-xs text-muted-foreground">
                Strongly encouraged: record the reference and destination so this payment can
                be traced later.
              </div>
              <div className="space-y-2">
                <Label htmlFor="external_ref">External reference no.</Label>
                <Input
                  id="external_ref"
                  placeholder="e.g. GCash TXN 1234567890"
                  value={externalRef}
                  onChange={(e) => setExternalRef(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Account / destination</Label>
                <Input
                  id="destination"
                  placeholder="e.g. BDO — Juan Dela Cruz"
                  value={destinationAccount}
                  onChange={(e) => setDestinationAccount(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!allowed || submitting}>
            {submitting ? "Processing…" : `Confirm ${formatMoney(net, symbol)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
