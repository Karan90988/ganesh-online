import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendExpoPush } from "@/lib/push";
import { ok, handleError } from "@/lib/api";

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;

function eligibleWindow() {
  const now = Date.now();
  return {
    from: new Date(now - SIXTY_DAYS), // active within last 60 days
    to: new Date(now - THREE_DAYS),   // but not ordered in last 3 days
  };
}

// GET — how many customers are eligible for reorder reminders
export async function GET() {
  try {
    await requireAdmin();
    const { from, to } = eligibleWindow();

    const count = await prisma.customer.count({
      where: {
        enquiries: {
          some: {
            pushToken: { not: null },
            createdAt: { gte: from, lte: to },
          },
        },
      },
    });

    return ok({ eligibleCount: count });
  } catch (error) {
    return handleError(error);
  }
}

// POST — send personalised reorder notifications
export async function POST() {
  try {
    await requireAdmin();
    const { from, to } = eligibleWindow();

    const customers = await prisma.customer.findMany({
      where: {
        enquiries: {
          some: {
            pushToken: { not: null },
            createdAt: { gte: from, lte: to },
          },
        },
      },
      include: {
        enquiries: {
          where: { createdAt: { gte: from } },
          include: { items: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    let sentCount = 0;

    for (const customer of customers) {
      // Latest push token from most recent enquiry that has one
      const token = customer.enquiries.find((e) => e.pushToken)?.pushToken;
      if (!token) continue;

      // Count how many times each product appears across all orders
      const freq = new Map<string, number>();
      for (const enquiry of customer.enquiries) {
        for (const item of enquiry.items) {
          freq.set(item.productName, (freq.get(item.productName) ?? 0) + 1);
        }
      }

      // Top 2 most-ordered products
      const top = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name]) => name);

      if (top.length === 0) continue;

      const firstName = customer.name.split(" ")[0];
      const productLine =
        top.length === 1 ? top[0] : `${top[0]} & ${top[1]}`;

      await sendExpoPush([token], {
        title: `Hi ${firstName}! Special offers are live`,
        body: `Reorder ${productLine} at the best price. Tap to begin reorder!`,
        data: { type: "REORDER" },
      });

      sentCount++;
    }

    return ok({ sentCount });
  } catch (error) {
    return handleError(error);
  }
}
