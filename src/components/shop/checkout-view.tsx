"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Loader2 } from "lucide-react";
import { CartMode, useCart, linesForMode, modeTotal } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { MIN_ORDER_VALUE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStoreHydrated } from "@/hooks/use-hydrated";

interface SuccessState {
  enquiryCode: string;
  whatsappUrl: string;
  grandTotal: number;
}

export function CheckoutView({ mode }: { mode: CartMode }) {
  const hydrated = useStoreHydrated();
  const basePath = mode === "WHOLESALE" ? "/wholesale" : "/retail";
  const items = useCart((s) => s.items);
  const lines = linesForMode(items, mode);
  const total = modeTotal(items, mode);
  const clearMode = useCart((s) => s.clearMode);

  const minValue = MIN_ORDER_VALUE[mode];
  const belowMin = total < minValue;

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [shopName, setShopName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  if (!hydrated) return null;

  if (!success && lines.length === 0) {
    return (
      <div className="container flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href={basePath}>
          <Button size="lg">Browse Products</Button>
        </Link>
      </div>
    );
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Please enter your name";
    if (!/^[6-9]\d{9}$/.test(mobile)) e.mobile = "Enter a valid 10-digit mobile number";
    if (mode === "RETAIL" && deliveryAddress.trim().length < 10)
      e.deliveryAddress = "Please enter your full delivery address";
    if (belowMin)
      e.form = `Minimum ${mode === "WHOLESALE" ? "wholesale" : "retail"} order is ${formatCurrency(minValue)}. Add ${formatCurrency(minValue - total)} more.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        type: mode,
        customerName: name.trim(),
        mobile,
        shopName: mode === "WHOLESALE" ? shopName.trim() : undefined,
        deliveryAddress: mode === "RETAIL" ? deliveryAddress.trim() : undefined,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, variant: l.variant })),
      };
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Could not place order");
      }
      const data = json.data as SuccessState & { enquiryId: string };
      setSuccess(data);
      clearMode(mode);
      // Best-effort: redirect to WhatsApp + flag sent
      fetch(`/api/enquiries/${data.enquiryId}/sent`, { method: "POST" }).catch(() => {});
      // Open WhatsApp in a new tab (manual button below if blocked)
      window.open(data.whatsappUrl, "_blank");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Success screen ----------
  if (success) {
    return (
      <div className="container flex flex-col items-center gap-4 py-14 text-center">
        <CheckCircle2 className="h-16 w-16 text-primary" />
        <h1 className="text-2xl font-bold">Order saved!</h1>
        <p className="text-muted-foreground">
          Your enquiry ID is{" "}
          <span className="font-bold text-foreground">{success.enquiryCode}</span>.
          <br />
          We&apos;ve recorded your order. Tap below to send it on WhatsApp so we can
          confirm delivery.
        </p>
        <a href={success.whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full max-w-xs">
          <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#1ebe5d]">
            <MessageCircle className="h-5 w-5" /> Send on WhatsApp
          </Button>
        </a>
        <Link href={basePath} className="text-sm font-semibold text-primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  // ---------- Checkout form ----------
  return (
    <div className="container py-4">
      <h1 className="mb-1 text-2xl font-bold">Checkout</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {mode === "WHOLESALE" ? "Wholesale Order Enquiry" : "Retail Order Enquiry"} — no
        online payment. We confirm everything on WhatsApp.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div>
            <Label htmlFor="name">Your Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="mobile">Mobile Number *</Label>
            <Input
              id="mobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit mobile number"
            />
            {errors.mobile && <p className="mt-1 text-sm text-destructive">{errors.mobile}</p>}
          </div>

          {mode === "WHOLESALE" ? (
            <div>
              <Label htmlFor="shop">Shop Name (optional)</Label>
              <Input id="shop" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. ABC Stores" />
            </div>
          ) : (
            <div>
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="House / shop no., building, road, area, landmark, pincode"
                rows={4}
              />
              {errors.deliveryAddress && (
                <p className="mt-1 text-sm text-destructive">{errors.deliveryAddress}</p>
              )}
            </div>
          )}

          {errors.form && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{errors.form}</p>
          )}
        </div>

        {/* Order summary */}
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 font-bold">Order Summary</h2>
            <ul className="space-y-2">
              {lines.map((l, i) => (
                <li key={l.key} className="flex justify-between gap-2 text-sm">
                  <span className="flex-1">
                    {i + 1}. {l.displayName}{" "}
                    <span className="text-muted-foreground">
                      × {l.quantity} {l.unitLabel}
                    </span>
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(l.unitPrice * l.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {belowMin && (
            <p className="rounded-lg bg-amber-50 p-3 text-center text-sm font-medium text-amber-800">
              Minimum {mode === "WHOLESALE" ? "wholesale" : "retail"} order is{" "}
              {formatCurrency(minValue)}. Add {formatCurrency(minValue - total)} more.
            </p>
          )}
          <Button size="lg" className="w-full" onClick={handleSubmit} disabled={submitting || belowMin}>
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <MessageCircle className="h-5 w-5" /> Place Order on WhatsApp
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Your order is saved with us even if you don&apos;t send the WhatsApp message.
          </p>
        </div>
      </div>
    </div>
  );
}
