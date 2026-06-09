import { ShopShell } from "@/components/shop/shop-shell";
import { CheckoutView } from "@/components/shop/checkout-view";

export const metadata = { title: "Checkout" };

export default function RetailCheckoutPage() {
  return (
    <ShopShell mode="RETAIL" hideCartBar>
      <CheckoutView mode="RETAIL" />
    </ShopShell>
  );
}
