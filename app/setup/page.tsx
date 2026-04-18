"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, INDUSTRIES } from "@/lib/constants";
import { sessionService } from "@/lib/services";
import { createClient } from "@/lib/supabase/client";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Retail");
  const [currency, setCurrency] = useState("PHP");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const sb = createClient();
      const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₱";
      await sessionService.bootstrapBusiness(sb, {
        name,
        industry,
        currency,
        symbol,
        full_name: fullName,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-svh place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set up your business</CardTitle>
          <CardDescription>You can change these anytime from Settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                required
                placeholder="e.g. Juan's Sari-Sari Store"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
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
              <Select value={currency} onValueChange={setCurrency}>
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
              <Label htmlFor="owner">Your full name (optional)</Label>
              <Input
                id="owner"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating…" : "Create business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
