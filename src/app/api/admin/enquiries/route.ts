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
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const where: Prisma.EnquiryWhereInput = {};
    if (type) where.type = type as Prisma.EnquiryWhereInput["type"];
    if (status) where.status = status as Prisma.EnquiryWhereInput["status"];
    if (search) {
      where.OR = [
        { enquiryCode: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search } },
        { shopName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, enquiries] = await Promise.all([
      prisma.enquiry.count({ where }),
      prisma.enquiry.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * ADMIN_PAGE_SIZE,
        take: ADMIN_PAGE_SIZE,
      }),
    ]);

    return ok({
      enquiries: serialize(enquiries),
      pagination: { page, pageSize: ADMIN_PAGE_SIZE, total, totalPages: Math.ceil(total / ADMIN_PAGE_SIZE) },
    });
  } catch (error) {
    return handleError(error);
  }
}
