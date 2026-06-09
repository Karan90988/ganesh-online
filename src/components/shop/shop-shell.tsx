import { CartMode } from "@/store/cart";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { CartBar } from "./cart-bar";

/** Common chrome for all shop pages: header, mode sync, sticky cart bar, footer. */
export function ShopShell({
  mode,
  children,
  hideCartBar,
}: {
  mode: CartMode;
  children: React.ReactNode;
  hideCartBar?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader mode={mode} />
      <main className="flex-1 pb-24">{children}</main>
      {!hideCartBar && <CartBar mode={mode} />}
      <SiteFooter />
    </div>
  );
}
