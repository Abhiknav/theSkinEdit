import { createBooking } from "@/server/booking/service";
import { fail, ok, readJson } from "@/server/http";
import { createBookingSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = createBookingSchema.parse(await readJson(request));
    const appointment = await createBooking({
      slotId: input.slotId,
      mode: input.mode,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      reason: input.reason ?? null,
    });
    return ok({ appointment }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
