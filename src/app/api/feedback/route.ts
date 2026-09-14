import { listPublishedTestimonials, submitFeedback } from "@/server/booking/service";
import { fail, ok, readJson } from "@/server/http";
import { feedbackSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ testimonials: await listPublishedTestimonials() });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = feedbackSchema.parse(await readJson(request));
    await submitFeedback({
      reference: input.reference ?? null,
      patientName: input.patientName,
      rating: input.rating,
      comment: input.comment,
    });
    // Nothing is published until the doctor approves it in her dashboard.
    return ok({ received: true }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
