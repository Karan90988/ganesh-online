import { Suspense } from "react";
import { Metadata } from "next";
import { ShopShell } from "@/components/shop/shop-shell";
import { ProductListing } from "@/components/shop/listing";
import { ListingSkeleton } from "@/components/shop/listing-skeleton";

export const metadata: Metadata = {
  title: "Wholesale Products",
  description: "Bulk wholesale prices on rice, pulses, oil, sugar and more for shops and businesses. Place your wholesale enquiry on WhatsApp.",
};

export default function WholesalePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}) {
  return (
    <ShopShell mode="WHOLESALE">
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing mode="WHOLESALE" searchParamsPromise={searchParams} />
      </Suspense>
    </ShopShell>
  );
}
