import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations";
import { createEnquiry } from "@/services/enquiry.service";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { sendExpoPush } from "@/lib/push";
import { formatCurrency } from "@/lib/utils";
import { ok, handleError } from "@/lib/api";

/**
 * Customer checkout endpoint (public).
 *
 * Flow:
 *   1. Validate input with Zod.
 *   2. Persist the enquiry + items + customer to PostgreSQL (authoritative
 *      prices read from DB). This happens BEFORE any WhatsApp redirect so the
 *      shop owner always receives the lead in the Admin Panel — even if the
 *      customer closes WhatsApp without sending.
 *   3. Return the enquiry code + pre-built WhatsApp deep link.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = checkoutSchema.parse(body);

    const enquiry = await createEnquiry(input);

    // Push notifications (best-effort): confirm to the customer's device + alert
    // every shop-owner device that opted into new-order alerts.
    const ownerDevices = await prisma.ownerDevice.findMany({ select: { token: true } });
    await Promise.all([
      enquiry.pushToken
        ? sendExpoPush([enquiry.pushToken], {
            title: "Order placed ✅",
            body: `Order ${enquiry.enquiryCode} received. We'll confirm on WhatsApp.`,
            data: { enquiryCode: enquiry.enquiryCode },
          })
        : Promise.resolve(),
      ownerDevices.length
        ? sendExpoPush(
            ownerDevices.map((d) => d.token),
            {
              title: "🛒 New order received",
              body: `${enquiry.enquiryCode} · ${enquiry.type === "WHOLESALE" ? "Wholesale" : "Retail"} · ${formatCurrency(enquiry.grandTotal)} · ${enquiry.customerName}`,
              data: { enquiryCode: enquiry.enquiryCode },
            }
          )
        : Promise.resolve(),
    ]);

    const message = buildWhatsAppMessage({
      enquiryCode: enquiry.enquiryCode,
      type: enquiry.type,
      customerName: enquiry.customerName,
      mobile: enquiry.mobile,
      shopName: enquiry.shopName,
      deliveryArea: enquiry.deliveryArea as never,
      deliveryAddress: enquiry.deliveryAddress,
      items: enquiry.items.map((it) => ({
        productName: it.productName,
        unit: it.unit as never,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      })),
      grandTotal: enquiry.grandTotal,
      deliveryCharge: enquiry.deliveryCharge,
    });

    const whatsappNumber = process.env.WHATSAPP_NUMBER || "";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

    return ok({
      enquiryId: enquiry.id,
      enquiryCode: enquiry.enquiryCode,
      whatsappUrl,
      grandTotal: enquiry.grandTotal,
    });
  } catch (error) {
    return handleError(error);
  }
}
