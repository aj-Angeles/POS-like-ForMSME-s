"use client";

import { format } from "date-fns";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransaction } from "@/hooks/use-transactions";
import { formatMoney, formatNumber } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

export function ReceiptDialog({
  transactionId,
  open,
  onOpenChange,
}: {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, loading } = useTransaction(transactionId);
  const business = useSession((s) => s.business);
  const symbol = business?.currency_symbol ?? "₱";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>

        <div id="receipt-printable" className="space-y-3 text-sm">
          {loading || !data ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <div className="text-center">
                <div className="font-semibold">{business?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(data.created_at), "PPpp")}
                </div>
                <div className="mt-1 font-mono text-xs">{data.ref_no}</div>
              </div>
              <Separator />
              <div className="space-y-1">
                {data.transaction_items.map((i) => (
                  <div key={i.id} className="flex justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{i.product_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(i.quantity, 0)} × {formatMoney(i.unit_price, symbol)}
                        {i.line_discount ? ` − ${formatMoney(i.line_discount, symbol)}` : ""}
                      </div>
                    </div>
                    <div className="tabular-nums">{formatMoney(i.line_total, symbol)}</div>
                  </div>
                ))}
              </div>
              <Separator />
              <Row label="Gross" value={formatMoney(data.gross_total, symbol)} />
              {data.discount_amount ? (
                <Row label="Discount" value={`− ${formatMoney(data.discount_amount, symbol)}`} />
              ) : null}
              <Row
                label={<span className="font-semibold">Total</span>}
                value={<span className="font-semibold">{formatMoney(data.net_total, symbol)}</span>}
              />
              <Separator />
              <Row label="Payment" value={<span className="capitalize">{data.payment_method.replace("_", " ")}</span>} />
              {data.amount_tendered != null ? (
                <>
                  <Row label="Tendered" value={formatMoney(data.amount_tendered, symbol)} />
                  <Row label="Change" value={formatMoney(data.change_due ?? 0, symbol)} />
                </>
              ) : null}
              {data.external_ref ? <Row label="Ref" value={data.external_ref} /> : null}
              {data.destination_account ? <Row label="To" value={data.destination_account} /> : null}
            </>
          )}
        </div>

        <DialogFooter className="no-print">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
