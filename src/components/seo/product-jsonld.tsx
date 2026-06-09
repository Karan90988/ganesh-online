import { ProductDTO } from "@/types";

/** Schema.org Product structured data for rich search results. */
export function ProductJsonLd({ product, price }: { product: ProductDTO; price: number }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description || product.name,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    category: product.category?.name,
    brand: { "@type": "Brand", name: "Ganesh Trading Company" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/retail/product/${product.slug}`,
      priceCurrency: "INR",
      price: Number(price).toFixed(2),
      availability:
        product.status === "OUT_OF_STOCK"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
