import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { LanguageProvider } from "@/i18n/context";
import { getLocale } from "@/i18n/server";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Ganesh Trading Company";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${businessName} — Wholesale & Retail Kirana Store`,
    template: `%s | ${businessName}`,
  },
  description:
    "Order groceries, rice, pulses, oil and household items at wholesale and retail prices from Ganesh Trading Company. Place your order on WhatsApp — fast delivery in Virar, Vasai & Nalasopara.",
  keywords: [
    "wholesale kirana",
    "retail grocery",
    "Ganesh Trading Company",
    "Virar grocery delivery",
    "Vasai wholesale",
    "Nalasopara kirana",
  ],
  openGraph: {
    title: `${businessName} — Wholesale & Retail Kirana Store`,
    description: "Browse products and order on WhatsApp. Wholesale & retail prices.",
    url: siteUrl,
    siteName: businessName,
    type: "website",
    locale: "en_IN",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={inter.className}>
        <LanguageProvider initialLocale={locale}>
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
