"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Loader2, UserCheck } from "lucide-react";
import { CartMode, useCart, linesForMode, modeTotal } from "@/store/cart";
import { useCustomer } from "@/store/customer";
import { formatCurrency } from "@/lib/utils";
import { useStoreSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStoreHydrated } from "@/hooks/use-hydrated";
import { useT } from "@/i18n/context";

interface SuccessState {
  enquiryCode: string;
  whatsappUrl: string;
  grandTotal: number;
}

export function CheckoutView({ mode }: { mode: CartMode }) {
  const hydrated = useStoreHydrated();
  const t = useT();
  const basePath = mode === "WHOLESALE" ? "/wholesale" : "/retail";
  const items = useCart((s) => s.items);
  const lines = linesForMode(items, mode);
  const total = modeTotal(items, mode);
  const clearMode = useCart((s) => s.clearMode);
  const settings = useStoreSettings();

  const isRetail = mode === "RETAIL";
  const deliveryCharge =
    isRetail && total < settings.retailFreeDeliveryThreshold ? settings.retailDeliveryCharge : 0;
  const grand = total + deliveryCharge;
  const minValue = settings.wholesaleMinOrderValue;
  const belowMin = !isRetail && total < minValue;

  const profile = useCustomer((s) => s.profile);
  const saveProfile = useCustomer((s) => s.saveProfile);
  const clearProfile = useCustomer((s) => s.clearProfile);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [shopName, setShopName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // Pre-fill the form once from the saved on-device profile.
  useEffect(() => {
    if (profile && !prefilled) {
      setName(profile.name || "");
      setMobile(profile.mobile || "");
      setShopName(profile.shopName || "");
      setDeliveryAddress(profile.address || "");
      setPrefilled(true);
    }
  }, [profile, prefilled]);

  function forgetMe() {
    clearProfile();
    setName("");
    setMobile("");
    setShopName("");
    setDeliveryAddress("");
  }

  if (!hydrated) return null;

  if (!success && lines.length === 0) {
    return (
      <div className="container flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-bold">{t("cart.empty")}</h1>
        <Link href={basePath}>
          <Button size="lg">{t("common.browseProducts")}</Button>
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
      e.form = t("checkout.minNotice", {
        min: formatCurrency(minValue),
        more: formatCurrency(minValue - total),
      });
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
      // Remember details on this device for next time (no login required).
      saveProfile({
        name: name.trim(),
        mobile,
        shopName: shopName.trim(),
        address: deliveryAddress.trim(),
      });
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
        <h1 className="text-2xl font-bold">{t("checkout.orderSaved")}</h1>
        <p className="text-muted-foreground">
          {t("checkout.yourOrderId")}{" "}
          <span className="font-bold text-foreground">{success.enquiryCode}</span>.
          <br />
          {t("checkout.recordedNote")}
        </p>
        <a href={success.whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full max-w-xs">
          <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#1ebe5d]">
            <MessageCircle className="h-5 w-5" /> {t("checkout.sendWhatsApp")}
          </Button>
        </a>
        <Link href={basePath} className="text-sm font-semibold text-primary">
          {t("common.continueShopping")}
        </Link>
      </div>
    );
  }

  // ---------- Checkout form ----------
  return (
    <div className="container py-4">
      <h1 className="mb-1 text-2xl font-bold">{t("checkout.title")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {mode === "WHOLESALE" ? t("checkout.wholesaleOrder") : t("checkout.retailOrder")} —{" "}
        {t("checkout.paymentNote")}
      </p>

      <div className="mx-auto max-w-xl space-y-4">
        {profile && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <UserCheck className="h-4 w-4 text-primary" />
              {t("checkout.welcomeBack", { name: profile.name || "customer" })}
            </span>
            <button onClick={forgetMe} className="shrink-0 font-semibold text-primary hover:underline">
              {t("checkout.notYou")}
            </button>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div>
            <Label htmlFor="name">{t("checkout.yourName")} *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("checkout.namePlaceholder")} />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="mobile">{t("checkout.mobileNumber")} *</Label>
            <Input
              id="mobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              placeholder={t("checkout.mobilePlaceholder")}
            />
            {errors.mobile && <p className="mt-1 text-sm text-destructive">{errors.mobile}</p>}
          </div>

          {mode === "WHOLESALE" ? (
            <div>
              <Label htmlFor="shop">{t("checkout.shopNameOptional")}</Label>
              <Input id="shop" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder={t("checkout.shopPlaceholder")} />
            </div>
          ) : (
            <div>
              <Label htmlFor="address">{t("checkout.deliveryAddress")} *</Label>
              <Textarea
                id="address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={t("checkout.addressPlaceholder")}
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

        {/* Total + submit */}
        <div className="rounded-xl border bg-card p-4">
          {isRetail ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("common.subtotal")}</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("common.delivery")}</span>
                {deliveryCharge > 0 ? (
                  <span>{formatCurrency(deliveryCharge)}</span>
                ) : (
                  <span className="font-bold text-primary">{t("common.free")}</span>
                )}
              </div>
              <div className="flex items-center justify-between border-t pt-1.5 text-lg font-bold">
                <span>{t("common.grandTotal")}</span>
                <span>{formatCurrency(grand)}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-lg font-bold">
              <span>{t("common.grandTotal")}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          )}
        </div>

        {belowMin && (
          <p className="rounded-lg bg-amber-50 p-3 text-center text-sm font-medium text-amber-800">
            {t("checkout.minNotice", {
              min: formatCurrency(minValue),
              more: formatCurrency(minValue - total),
            })}
          </p>
        )}
        <Button size="lg" className="w-full" onClick={handleSubmit} disabled={submitting || belowMin}>
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> ...
            </>
          ) : (
            <>
              <MessageCircle className="h-5 w-5" /> {t("checkout.placeOrder")}
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t("checkout.savedNote")}</p>
      </div>
    </div>
  );
}
