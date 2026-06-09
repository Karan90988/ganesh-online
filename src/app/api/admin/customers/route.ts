import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError, serialize } from "@/lib/api";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const where: Prisma.CustomerWhereInput = {};
    if (type) where.type = type as Prisma.CustomerWhereInput["type"];
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search } },
        { shopName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        include: { _count: { select: { enquiries: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * ADMIN_PAGE_SIZE,
        take: ADMIN_PAGE_SIZE,
      }),
    ]);

    return ok({
      customers: serialize(customers),
      pagination: { page, pageSize: ADMIN_PAGE_SIZE, total, totalPages: Math.ceil(total / ADMIN_PAGE_SIZE) },
    });
  } catch (error) {
    return handleError(error);
  }
}
