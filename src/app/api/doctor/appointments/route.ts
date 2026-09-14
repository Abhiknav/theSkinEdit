import { requireDoctor } from "@/server/auth/doctor";
import { getAppointments, setAppointmentStatus } from "@/server/booking/admin";
import { fail, ok, readJson } from "@/server/http";
import { appointmentStatusSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDoctor();
    return ok({ appointments: await getAppointments() });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireDoctor();
    const input = appointmentStatusSchema.parse(await readJson(request));
    await setAppointmentStatus(input.appointmentId, input.status);
    return ok({ appointments: await getAppointments() });
  } catch (error) {
    return fail(error);
  }
}
