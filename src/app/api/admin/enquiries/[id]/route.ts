import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { enquiryStatusSchema } from "@/lib/validations";
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
    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: { status, notes: notes || undefined },
    });
    return ok(serialize(enquiry));
  } catch (error) {
    return handleError(error);
  }
}
