import { requireDoctor } from "@/server/auth/doctor";
import { getFeedback, setFeedbackStatus } from "@/server/booking/admin";
import { fail, ok, readJson } from "@/server/http";
import { feedbackStatusSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDoctor();
    return ok({ feedback: await getFeedback() });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireDoctor();
    const input = feedbackStatusSchema.parse(await readJson(request));
    await setFeedbackStatus(input.feedbackId, input.status);
    return ok({ feedback: await getFeedback() });
  } catch (error) {
    return fail(error);
  }
}
