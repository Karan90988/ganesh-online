import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategories, getTrendingProducts } from "@/lib/queries";
import { SiteFooter } from "@/components/shop/site-footer";
import { HomeLanding } from "@/components/shop/home-landing";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getServerT();
  const [categories, trending] = await Promise.all([getCategories(), getTrendingProducts()]);

  return (
    <div className="min-h-screen">
      {/* Retail / Wholesale themed landing (header, tabs, search, categories, trending) */}
      <HomeLanding categories={categories} trending={trending} />

      {/* Contact section */}
      <section className="container py-12">
        <div className="rounded-2xl border bg-accent/40 p-6 text-center">
          <h2 className="text-xl font-bold">{t("contact.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("contact.subtitle")}</p>
          <div className="mt-4 flex justify-center">
            <Link href="/contact">
              <Button size="lg">
                {t("common.contact")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
