"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ClipboardCheck, History } from "lucide-react";

import { ReconciliationHistory } from "@/components/inventory/reconciliation-history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReconciliation } from "@/hooks/use-inventory";
import { useProducts } from "@/hooks/use-products";
import { isVarianceFlagged, variance } from "@/lib/business-logic/inventory";
import { formatNumber } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

export default function ReconcilePage() {
  const products = useProducts({ activeOnly: true });
  const threshold = useSession((s) => s.business?.variance_threshold ?? 5);
  const create = useCreateReconciliation();
  const [note, setNote] = useState("");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const rows = useMemo(
    () =>
      (products.data ?? []).map((p) => {
        const raw = counts[p.id];
        const actual = raw === undefined || raw === "" ? p.stock : parseFloat(raw);
        const v = variance(p.stock, actual);
        return { product: p, actual, variance: v, flagged: isVarianceFlagged(v, threshold) };
      }),
    [products.data, counts, threshold],
  );

  async function save() {
    setErr(null);
    setSaving(true);
    try {
      const payload = rows
        .filter((r) => counts[r.product.id] !== undefined && counts[r.product.id] !== "")
        .map((r) => ({ product_id: r.product.id, actual_qty: r.actual }));
      if (payload.length === 0) {
        setErr("Enter at least one physical count.");
        return;
      }
      await create({ note, counts: payload });
      setNote("");
      setCounts({});
      await products.refetch();
      alert(`Reconciliation saved (${payload.length} item(s)).`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reconciliation</h1>
        <p className="text-sm text-muted-foreground">
          Compare the paper count (expected) to your physical count. Variance = actual −
          expected. Negative variance = shrinkage; positive = unrecorded restock or miscount.
          Flagged when |variance| ≥ {threshold}.
        </p>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">
            <ClipboardCheck className="mr-1 h-4 w-4" />
            New count
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          {rows.length === 0 ? (
            <Empty title="No products" />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Physical count</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                    <div>Product</div>
                    <div className="text-right">Expected</div>
                    <div className="text-right">Actual</div>
                    <div className="text-right">Variance</div>
                  </div>
                  {rows.map((r) => (
                    <div
                      key={r.product.id}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-2 rounded-md border p-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">{r.product.name}</div>
                        <div className="text-xs text-muted-foreground">{r.product.sku}</div>
                      </div>
                      <div className="text-right tabular-nums">
                        {formatNumber(r.product.stock, 0)} {r.product.unit}
                      </div>
                      <Input
                        inputMode="decimal"
                        className="h-8 text-right"
                        placeholder={String(r.product.stock)}
                        value={counts[r.product.id] ?? ""}
                        onChange={(e) =>
                          setCounts((c) => ({ ...c, [r.product.id]: e.target.value }))
                        }
                      />
                      <div
                        className={`text-right tabular-nums ${
                          r.flagged
                            ? r.variance < 0
                              ? "text-destructive font-semibold"
                              : "text-warning font-semibold"
                            : ""
                        }`}
                      >
                        {r.variance > 0 ? "+" : ""}
                        {formatNumber(r.variance, 0)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea
                  id="note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. weekly stocktake — Saturday morning"
                />
              </div>
              {err ? <p className="text-sm text-destructive">{err}</p> : null}
              <div className="flex justify-end">
                <Button onClick={save} disabled={saving}>
                  {saving
                    ? "Saving…"
                    : `Save reconciliation (${format(new Date(), "MMM d, HH:mm")})`}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="history">
          <ReconciliationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
