import { redirect } from "next/navigation";

import { AvailabilityManager } from "@/components/doctor/AvailabilityManager";
import { getSession } from "@/server/auth/doctor";
import { getSchedule } from "@/server/booking/admin";

export const dynamic = "force-dynamic";

export default async function DoctorAvailabilityPage() {
  if (!(await getSession())) redirect("/doctor");
  const { rules, blocks } = await getSchedule();

  return (
    <>
      <header className="mb-12">
        <div className="label">Availability</div>
        <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">When you are free.</h1>
      </header>
      <AvailabilityManager
        initialRules={rules.map((rule) => ({
          id: rule.id,
          weekday: rule.weekday,
          start_time: rule.start_time,
          end_time: rule.end_time,
          slot_minutes: rule.slot_minutes,
          modes: rule.modes,
          active: rule.active,
        }))}
        initialBlocks={blocks.map((block) => ({
          id: block.id,
          start_at: block.start_at,
          end_at: block.end_at,
          reason: block.reason,
        }))}
      />
    </>
  );
}
