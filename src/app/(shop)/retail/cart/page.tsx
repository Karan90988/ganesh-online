import { ShopShell } from "@/components/shop/shop-shell";
import { CartView } from "@/components/shop/cart-view";

export const metadata = { title: "Cart" };

export default function RetailCartPage() {
  return (
    <ShopShell mode="RETAIL" hideCartBar>
      <CartView mode="RETAIL" />
    </ShopShell>
  );
}
