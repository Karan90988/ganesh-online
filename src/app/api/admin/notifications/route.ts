import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendExpoPush } from "@/lib/push";
import { ok, fail, handleError, serialize } from "@/lib/api";

const broadcastSchema = z.object({
  channel: z.enum(["RETAIL", "WHOLESALE"]),
  title: z.string().min(1).max(50),
  body: z.string().min(1).max(150),
});

/** GET /api/admin/notifications — device reach count + last 10 broadcasts */
export async function GET() {
  try {
    await requireAdmin();

    const deviceCount = await prisma.appDevice.count();

    const logs = await prisma.broadcastLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return ok(serialize({ deviceCount, logs }));
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/admin/notifications — send a broadcast push notification */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { channel, title, body } = broadcastSchema.parse(await req.json());

    const rows = await prisma.appDevice.findMany({ select: { token: true } });
    const tokens = rows.map((r) => r.token);

    if (tokens.length === 0) return fail("No registered devices found", 400);

    await sendExpoPush(tokens, { title, body, data: { channel, type: "BROADCAST" } });

    const log = await prisma.broadcastLog.create({
      data: { channel, title, body, sentCount: tokens.length },
    });

    return ok(serialize({ sentCount: tokens.length, log }));
  } catch (error) {
    return handleError(error);
  }
}
