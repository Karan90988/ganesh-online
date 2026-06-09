import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, handleError, serialize } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** Customer detail + full order history. */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        enquiries: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!customer) return fail("Customer not found", 404);
    return ok(serialize(customer));
  } catch (error) {
    return handleError(error);
  }
}
