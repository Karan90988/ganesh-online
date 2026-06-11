"use client";

import Link from "next/link";
import { Store, Phone, MapPin } from "lucide-react";
import { useT } from "@/i18n/context";

export function SiteFooter() {
  const t = useT();
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+91 99999 99999";
  const address = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Virar West, Maharashtra";
  const mapUrl = process.env.NEXT_PUBLIC_BUSINESS_MAP_URL || "";
  return (
    <footer className="mt-12 border-t bg-muted/40">
      <div className="container py-8">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold">Ganesh Trading Company</span>
        </div>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">{t("footer.tagline")}</p>
        <div className="mt-4 space-y-2 text-sm">
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {phone}</p>
          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary"
            >
              <MapPin className="h-4 w-4 text-primary" /> {address}{" "}
              <span className="text-xs font-medium text-primary">{t("footer.viewMap")}</span>
            </a>
          ) : (
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {address}</p>
          )}
        </div>
        <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          <Link href="/retail" className="hover:text-primary">{t("header.retail")}</Link>
          <Link href="/wholesale" className="hover:text-primary">{t("header.wholesale")}</Link>
          <Link href="/categories" className="hover:text-primary">{t("footer.categories")}</Link>
          <Link href="/contact" className="hover:text-primary">{t("common.contact")}</Link>
          <Link href="/admin" className="hover:text-primary">{t("footer.admin")}</Link>
        </nav>
        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ganesh Trading Company. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
