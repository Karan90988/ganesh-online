import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { enquiryItemsUpdateSchema } from "@/lib/validations";
import { ok, fail, handleError, serialize } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/**
 * Edit the items of an enquiry (admin): change quantities/prices, and remove
 * items that are unavailable. Items not included in the payload are deleted.
 * The grand total is recomputed. Used to produce the FINAL invoice after the
 * shop confirms availability with the customer.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { items } = enquiryItemsUpdateSchema.parse(body);

    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!enquiry) return fail("Enquiry not found", 404);

    const existingById = new Map(enquiry.items.map((it) => [it.id, it]));
    const keepIds = new Set(items.map((i) => i.id));

    // Validate every submitted id belongs to this enquiry
    for (const i of items) {
      if (!existingById.has(i.id)) {
        return fail(`Item ${i.id} does not belong to this enquiry`, 400);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Delete removed items
      const toDelete = enquiry.items.filter((it) => !keepIds.has(it.id));
      if (toDelete.length) {
        await tx.enquiryItem.deleteMany({
          where: { id: { in: toDelete.map((it) => it.id) } },
        });
      }

      // Update kept items
      let grandTotal = 0;
      for (const i of items) {
        const existing = existingById.get(i.id)!;
        const unitPrice = i.unitPrice ?? Number(existing.unitPrice);
        const lineTotal = unitPrice * i.quantity;
        grandTotal += lineTotal;
        await tx.enquiryItem.update({
          where: { id: i.id },
          data: {
            quantity: i.quantity,
            unitPrice: new Prisma.Decimal(unitPrice),
            lineTotal: new Prisma.Decimal(lineTotal),
          },
        });
      }

      return tx.enquiry.update({
        where: { id },
        data: { grandTotal: new Prisma.Decimal(grandTotal) },
        include: { items: true },
      });
    });

    return ok(serialize(updated));
  } catch (error) {
    return handleError(error);
  }
}
