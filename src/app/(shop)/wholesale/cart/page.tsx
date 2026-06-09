import { ShopShell } from "@/components/shop/shop-shell";
import { CartView } from "@/components/shop/cart-view";

export const metadata = { title: "Wholesale Cart" };

export default function WholesaleCartPage() {
  return (
    <ShopShell mode="WHOLESALE" hideCartBar>
      <CartView mode="WHOLESALE" />
    </ShopShell>
  );
}
