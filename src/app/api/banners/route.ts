import { prisma } from "@/lib/prisma";
import { ok, handleError, serialize } from "@/lib/api";

/** Public: active promotion banners for the home/landing (web + mobile). */
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, text: true },
    });
    return ok(serialize(banners));
  } catch (error) {
    return handleError(error);
  }
}
