import { Suspense } from "react";
import { Metadata } from "next";
import { ShopShell } from "@/components/shop/shop-shell";
import { ProductListing } from "@/components/shop/listing";
import { ListingSkeleton } from "@/components/shop/listing-skeleton";

export const metadata: Metadata = {
  title: "Retail Products",
  description: "Shop groceries and household essentials at retail prices. Order on WhatsApp with home delivery in Virar, Vasai & Nalasopara.",
};

export default function RetailPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}) {
  return (
    <ShopShell mode="RETAIL">
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing mode="RETAIL" searchParamsPromise={searchParams} />
      </Suspense>
    </ShopShell>
  );
}
