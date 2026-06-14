import { CartMode } from "@/store/cart";
import { cn } from "@/lib/utils";
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
    <div className={cn("flex min-h-screen flex-col bg-accent/40", mode === "WHOLESALE" && "theme-wholesale")}>
      <SiteHeader mode={mode} />
      <main className="flex-1 pb-24">{children}</main>
      {!hideCartBar && <CartBar mode={mode} />}
      <SiteFooter />
    </div>
  );
}
