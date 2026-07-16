"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, Truck, ShoppingBag, Box, KeyRound } from "lucide-react";
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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [savingPw, setSavingPw] = useState(false);

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

  async function changePassword() {
    setPwError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      return setPwError("All three fields are required.");
    }
    if (newPassword.length < 8) {
      return setPwError("New password must be at least 8 characters.");
    }
    if (newPassword !== confirmPassword) {
      return setPwError("New password and confirmation do not match.");
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwError(json.error || "Failed to change password.");
      }
    } catch {
      setPwError("Network error — please try again.");
    } finally {
      setSavingPw(false);
    }
  }

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

      {/* Change Password */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <KeyRound className="h-4 w-4 text-primary" /> Change Password
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="cur-pw">Current Password</Label>
            <Input
              id="cur-pw"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-pw">New Password</Label>
            <Input
              id="new-pw"
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirm-pw">Confirm New Password</Label>
            <Input
              id="confirm-pw"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        {pwError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{pwError}</p>
        )}
        <Button onClick={changePassword} disabled={savingPw} variant="outline">
          {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {savingPw ? "Changing…" : "Change Password"}
        </Button>
      </div>
    </div>
  );
}

function fmt(n: number): string {
  return `₹${Math.max(0, n).toLocaleString("en-IN")}`;
}
