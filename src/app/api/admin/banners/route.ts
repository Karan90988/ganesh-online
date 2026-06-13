import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { bannerSchema } from "@/lib/validations";
import { ok, created, handleError, serialize } from "@/lib/api";

// List all banners (admin)
export async function GET() {
  try {
    await requireAdmin();
    const banners = await prisma.banner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return ok(serialize(banners));
  } catch (error) {
    return handleError(error);
  }
}

// Create a banner
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const data = bannerSchema.parse(await req.json());
    const banner = await prisma.banner.create({
      data: { text: data.text, sortOrder: data.sortOrder, isActive: data.isActive },
    });
    return created(serialize(banner));
  } catch (error) {
    return handleError(error);
  }
}
