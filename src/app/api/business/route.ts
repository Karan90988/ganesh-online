import { ok, handleError } from "@/lib/api";

/** Public business/contact info for the storefront and mobile app. */
export async function GET() {
  try {
    return ok({
      name: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Ganesh Trading Company",
      phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "",
      address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
      mapUrl: process.env.NEXT_PUBLIC_BUSINESS_MAP_URL || "",
      whatsapp: process.env.WHATSAPP_NUMBER || "",
      hours: "Open Everyday, 8 AM to 9 PM",
    });
  } catch (error) {
    return handleError(error);
  }
}
