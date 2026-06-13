import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { bannerSchema } from "@/lib/validations";
import { ok, handleError, serialize } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

// Update a banner
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = bannerSchema.parse(await req.json());
    const banner = await prisma.banner.update({
      where: { id },
      data: { text: data.text, sortOrder: data.sortOrder, isActive: data.isActive },
    });
    return ok(serialize(banner));
  } catch (error) {
    return handleError(error);
  }
}

// Delete a banner
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
