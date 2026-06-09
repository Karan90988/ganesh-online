import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopShell } from "@/components/shop/shop-shell";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductDetailSkeleton } from "@/components/shop/product-detail-skeleton";
import { ProductJsonLd } from "@/components/seo/product-jsonld";
import { getProductBySlug } from "@/lib/queries";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} (Wholesale)`,
    description: product.description || `Wholesale ${product.name} at Ganesh Trading Company.`,
  };
}

async function ProductContent({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  return (
    <>
      <ProductJsonLd product={product} price={product.wholesalePrice} />
      <ProductDetail product={product} mode="WHOLESALE" />
    </>
  );
}

export default function WholesaleProductPage({ params }: Params) {
  return (
    <ShopShell mode="WHOLESALE">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductContent params={params} />
      </Suspense>
    </ShopShell>
  );
}
