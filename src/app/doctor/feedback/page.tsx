import { redirect } from "next/navigation";

import { FeedbackInbox } from "@/components/doctor/FeedbackInbox";
import { getSession } from "@/server/auth/doctor";
import { getFeedback } from "@/server/booking/admin";

export const dynamic = "force-dynamic";

export default async function DoctorFeedbackPage() {
  if (!(await getSession())) redirect("/doctor");
  const feedback = await getFeedback();

  return (
    <>
      <header className="mb-12">
        <div className="label">Feedback</div>
        <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">What patients wrote.</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-soft">
          Nothing appears on the public site until you publish it here.
        </p>
      </header>
      <FeedbackInbox
        initial={feedback.map((row) => ({
          id: row.id,
          patient_name: row.patient_name,
          rating: row.rating,
          comment: row.comment,
          status: row.status,
          created_at: row.created_at,
        }))}
      />
    </>
  );
}
