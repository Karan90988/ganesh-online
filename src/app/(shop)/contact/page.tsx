import { Metadata } from "next";
import { Phone, MapPin, MessageCircle, Clock, Navigation } from "lucide-react";
import { ShopShell } from "@/components/shop/shop-shell";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Ganesh Trading Company for wholesale and retail grocery orders.",
};

export default async function ContactPage() {
  const t = await getServerT();
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+91 99999 99999";
  const address = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Virar West, Maharashtra";
  const mapUrl = process.env.NEXT_PUBLIC_BUSINESS_MAP_URL || "";
  const waNumber = process.env.WHATSAPP_NUMBER || "919999999999";
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hello Ganesh Trading Company, I have a question.")}`;

  return (
    <ShopShell mode="RETAIL">
      <div className="container max-w-2xl py-6">
        <h1 className="mb-1 text-2xl font-bold">{t("contact.title")}</h1>
        <p className="mb-6 text-muted-foreground">{t("contact.subtitle")}</p>

        <div className="space-y-3">
          <InfoRow icon={<Phone className="h-5 w-5" />} label={t("contact.phone")} value={phone} href={`tel:${phone.replace(/\s/g, "")}`} />
          <InfoRow
            icon={<MapPin className="h-5 w-5" />}
            label={t("contact.address")}
            value={address}
            href={mapUrl || undefined}
          />
          <InfoRow icon={<Clock className="h-5 w-5" />} label={t("contact.open")} value="Open Everyday, 8 AM to 9 PM" />
        </div>

        {mapUrl && (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block">
            <Button size="lg" variant="outline" className="w-full">
              <Navigation className="h-5 w-5" /> {t("contact.getDirections")}
            </Button>
          </a>
        )}

        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block">
          <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#1ebe5d]">
            <MessageCircle className="h-5 w-5" /> {t("contact.chatWhatsApp")}
          </Button>
        </a>
      </div>
    </ShopShell>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
        {icon}
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </>
  );
  const className = "flex items-center gap-4 rounded-xl border bg-card p-4";
  if (href) {
    const external = href.startsWith("http");
    return (
      <a
        href={href}
        className={`${className} transition-colors hover:bg-accent/50`}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }
  return <div className={className}>{content}</div>;
}
