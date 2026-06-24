import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { enquiryStatusSchema } from "@/lib/validations";
import { sendExpoPush } from "@/lib/push";
import { ok, fail, handleError, serialize } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: { items: true, customer: true },
    });
    if (!enquiry) return fail("Enquiry not found", 404);
    return ok(serialize(enquiry));
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { status, notes } = enquiryStatusSchema.parse(body);

    const before = await prisma.enquiry.findUnique({
      where: { id },
      select: { status: true, pushToken: true, enquiryCode: true },
    });
    if (!before) return fail("Enquiry not found", 404);

    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: { status, notes: notes || undefined },
    });

    // Notify the customer's device when an order is newly marked delivered.
    if (status === "DELIVERED" && before.status !== "DELIVERED" && before.pushToken) {
      await sendExpoPush([before.pushToken], {
        title: "Delivered 🎉",
        body: `Your order ${before.enquiryCode} has been delivered. Thank you for shopping with us!`,
        data: { enquiryCode: before.enquiryCode },
      });
    }

    return ok(serialize(enquiry));
  } catch (error) {
    return handleError(error);
  }
}
