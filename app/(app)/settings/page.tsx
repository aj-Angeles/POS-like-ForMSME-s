"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabase } from "@/hooks/use-supabase";
import { sessionService } from "@/lib/services";
import { CURRENCIES, DEFAULT_THEME, INDUSTRIES } from "@/lib/constants";
import type { Business, BusinessTheme } from "@/lib/types";
import { useSession } from "@/stores/session-store";

const PRESETS: { label: string; value: BusinessTheme }[] = [
  { label: "Aquamarine", value: { primary: "172 66% 42%", accent: "172 66% 95%", radius: "0.6rem" } },
  { label: "Indigo", value: { primary: "234 76% 55%", accent: "234 76% 95%", radius: "0.6rem" } },
  { label: "Rose", value: { primary: "346 78% 52%", accent: "346 78% 95%", radius: "0.6rem" } },
  { label: "Emerald", value: { primary: "158 64% 40%", accent: "158 64% 94%", radius: "0.6rem" } },
  { label: "Amber", value: { primary: "36 96% 50%", accent: "36 96% 94%", radius: "0.6rem" } },
  { label: "Slate", value: { primary: "215 20% 30%", accent: "215 20% 94%", radius: "0.5rem" } },
];

export default function SettingsPage() {
  const sb = useSupabase();
  const business = useSession((s) => s.business);
  const role = useSession((s) => s.role);
  const switchBusiness = useSession((s) => s.switchBusiness);

  const [name, setName] = useState(business?.name ?? "");
  const [industry, setIndustry] = useState(business?.industry ?? "Retail");
  const [currency, setCurrency] = useState(business?.currency ?? "PHP");
  const [symbol, setSymbol] = useState(business?.currency_symbol ?? "₱");
  const [lowStock, setLowStock] = useState(String(business?.low_stock_default ?? 10));
  const [theme, setTheme] = useState<BusinessTheme>(
    (business?.theme as unknown as BusinessTheme) ?? DEFAULT_THEME,
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!business) return;
    setName(business.name);
    setIndustry(business.industry ?? "Retail");
    setCurrency(business.currency);
    setSymbol(business.currency_symbol);
    setLowStock(String(business.low_stock_default));
    setTheme((business.theme as unknown as BusinessTheme) ?? DEFAULT_THEME);
  }, [business?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const canEdit = role === "owner";

  const previewStyle = useMemo(
    () =>
      ({
        "--primary": theme.primary,
        "--accent": theme.accent,
        "--radius": theme.radius,
      }) as React.CSSProperties,
    [theme],
  );

  async function save() {
    if (!business) return;
    setSaving(true);
    setMsg(null);
    try {
      const patch: Partial<Business> = {
        name,
        industry,
        currency,
        currency_symbol: symbol,
        low_stock_default: Math.max(0, parseInt(lowStock) || 0),
        theme: theme as unknown as Business["theme"],
      };
      const updated = await sessionService.updateBusiness(sb, business.id, patch);
      if (role) switchBusiness(updated, role);
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!business) return null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          {canEdit ? "Update business details, currency, and theme." : "Only owners can edit settings."}
        </p>
      </div>

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Business details</CardTitle>
              <CardDescription>Used across receipts and exports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bname">Business name</Label>
                  <Input id="bname" value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={industry} onValueChange={setIndustry} disabled={!canEdit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={currency}
                    onValueChange={(v) => {
                      setCurrency(v);
                      const c = CURRENCIES.find((x) => x.code === v);
                      if (c) setSymbol(c.symbol);
                    }}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} — {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sym">Symbol</Label>
                  <Input
                    id="sym"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="low">Default low-stock threshold</Label>
                  <Input
                    id="low"
                    type="number"
                    value={lowStock}
                    onChange={(e) => setLowStock(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
              {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
              <div className="flex justify-end">
                <Button onClick={save} disabled={!canEdit || saving}>
                  <Save className="mr-1 h-4 w-4" />
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Theme updates apply immediately. See <code>docs/THEMING.md</code> for a full guide.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 md:grid-cols-6">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setTheme(p.value)}
                    className="group flex flex-col items-stretch rounded-lg border p-2 text-left transition hover:border-primary disabled:opacity-60"
                  >
                    <div
                      className="h-10 rounded-md"
                      style={{ background: `hsl(${p.value.primary})` }}
                    />
                    <div className="mt-2 text-xs font-medium">{p.label}</div>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary HSL</Label>
                  <Input
                    value={theme.primary}
                    onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Accent HSL</Label>
                  <Input
                    value={theme.accent}
                    onChange={(e) => setTheme({ ...theme, accent: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Radius</Label>
                  <Input
                    value={theme.radius}
                    onChange={(e) => setTheme({ ...theme, radius: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div style={previewStyle} className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground">Preview</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button>Primary button</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="secondary">Secondary</Button>
                  <span className="inline-flex items-center rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
                    Accent chip
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={save} disabled={!canEdit || saving}>
                  <Save className="mr-1 h-4 w-4" />
                  {saving ? "Saving…" : "Save theme"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
