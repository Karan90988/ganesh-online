import { ShopShell } from "@/components/shop/shop-shell";
import { CheckoutView } from "@/components/shop/checkout-view";

export const metadata = { title: "Wholesale Checkout" };

export default function WholesaleCheckoutPage() {
  return (
    <ShopShell mode="WHOLESALE" hideCartBar>
      <CheckoutView mode="WHOLESALE" />
    </ShopShell>
  );
}
