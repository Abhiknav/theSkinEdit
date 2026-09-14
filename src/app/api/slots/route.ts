import { getAvailability } from "@/server/booking/service";
import { fail, ok } from "@/server/http";
import { modeSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawMode = url.searchParams.get("mode");
    const mode = rawMode ? modeSchema.parse(rawMode) : undefined;
    const days = url.searchParams.get("days");
    const availability = await getAvailability({
      mode,
      days: days ? Number(days) : undefined,
    });
    return ok(availability, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
