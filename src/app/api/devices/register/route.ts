import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";

const schema = z.object({
  token: z.string().startsWith("ExponentPushToken"),
});

/** POST /api/devices/register — called on every app launch to register the device token. */
export async function POST(req: NextRequest) {
  try {
    const { token } = schema.parse(await req.json());
    await prisma.appDevice.upsert({
      where: { token },
      update: { updatedAt: new Date() },
      create: { token },
    });
    return ok({ registered: true });
  } catch (error) {
    return handleError(error);
  }
}
