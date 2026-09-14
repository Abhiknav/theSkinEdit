import { rescheduleBooking } from "@/server/booking/service";
import { fail, ok, readJson } from "@/server/http";
import { rescheduleSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = rescheduleSchema.parse(await readJson(request));
    const appointment = await rescheduleBooking(input.reference, input.phone, input.slotId, input.mode);
    return ok({ appointment });
  } catch (error) {
    return fail(error);
  }
}
