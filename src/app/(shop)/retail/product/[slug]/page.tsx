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
    title: product.name,
    description: product.description || `Buy ${product.name} at Ganesh Trading Company.`,
    openGraph: {
      title: product.name,
      description: product.description || product.name,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

async function ProductContent({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  return (
    <>
      <ProductJsonLd product={product} price={product.retailPrice} />
      <ProductDetail product={product} mode="RETAIL" />
    </>
  );
}

export default function RetailProductPage({ params }: Params) {
  return (
    <ShopShell mode="RETAIL">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductContent params={params} />
      </Suspense>
    </ShopShell>
  );
}
