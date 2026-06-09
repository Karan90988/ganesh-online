import { NextRequest } from "next/server";
import { markWhatsAppSent } from "@/services/enquiry.service";
import { ok, handleError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** Best-effort flag set when the customer was redirected to WhatsApp. */
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await markWhatsAppSent(id);
    return ok({ marked: true });
  } catch (error) {
    return handleError(error);
  }
}
