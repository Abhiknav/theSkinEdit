import { cancelBooking } from "@/server/booking/service";
import { fail, ok, readJson } from "@/server/http";
import { lookupSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = lookupSchema.parse(await readJson(request));
    const appointment = await cancelBooking(input.reference, input.phone);
    return ok({ appointment });
  } catch (error) {
    return fail(error);
  }
}
