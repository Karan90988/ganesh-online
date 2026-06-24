"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, Truck, ShoppingBag, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface Settings {
  retailFreeDeliveryThreshold: number;
  retailDeliveryCharge: number;
  wholesaleMinOrderValue: number;
}

export function SettingsManager() {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/settings");
    const json = await res.json();
    if (json.success) setSettings(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (key: keyof Settings, value: string) => {
    const n = value === "" ? 0 : Math.max(0, Math.round(Number(value) || 0));
    setSettings((s) => (s ? { ...s, [key]: n } : s));
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    if (json.success) {
      setSettings(json.data);
      toast.success("Settings saved");
    } else {
      toast.error("Save failed", json.error);
    }
    setSaving(false);
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Delivery & Order Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control the delivery charge and minimum order values applied at checkout.
        </p>
      </div>

      {/* Retail */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <ShoppingBag className="h-4 w-4 text-primary" /> Retail
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="freeThreshold">Free delivery above (₹)</Label>
            <Input
              id="freeThreshold"
              type="number"
              min={0}
              value={settings.retailFreeDeliveryThreshold}
              onChange={(e) => update("retailFreeDeliveryThreshold", e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Carts at or above this amount get free delivery.
            </p>
          </div>
          <div>
            <Label htmlFor="deliveryCharge">Delivery charge below threshold (₹)</Label>
            <Input
              id="deliveryCharge"
              type="number"
              min={0}
              value={settings.retailDeliveryCharge}
              onChange={(e) => update("retailDeliveryCharge", e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Added to the order when the cart is below the free-delivery amount.
            </p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-accent/60 p-3 text-sm text-accent-foreground">
          <Truck className="h-4 w-4 shrink-0" />
          A retail cart of {fmt(settings.retailFreeDeliveryThreshold - 1)} pays{" "}
          {fmt(settings.retailDeliveryCharge)} delivery; {fmt(settings.retailFreeDeliveryThreshold)}+ ships free.
        </p>
      </div>

      {/* Wholesale */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Box className="h-4 w-4 text-primary" /> Wholesale
        </h2>
        <div className="max-w-xs">
          <Label htmlFor="wholesaleMin">Minimum order value (₹)</Label>
          <Input
            id="wholesaleMin"
            type="number"
            min={0}
            value={settings.wholesaleMinOrderValue}
            onChange={(e) => update("wholesaleMinOrderValue", e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Wholesale orders below this value cannot be placed.
          </p>
        </div>
      </div>

      <Button onClick={save} disabled={saving} size="lg">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        Save settings
      </Button>
    </div>
  );
}

function fmt(n: number): string {
  return `₹${Math.max(0, n).toLocaleString("en-IN")}`;
}
