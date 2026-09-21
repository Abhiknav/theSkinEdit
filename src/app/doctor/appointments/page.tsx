import { redirect } from "next/navigation";

import { AppointmentsBoard } from "@/components/doctor/AppointmentsBoard";
import { StorageNotice } from "@/components/doctor/StorageNotice";
import { getSession } from "@/server/auth/doctor";
import { getAppointments, getStorageHealth } from "@/server/booking/admin";

export const dynamic = "force-dynamic";

export default async function DoctorAppointmentsPage() {
  if (!(await getSession())) redirect("/doctor");
  const [appointments, storage] = await Promise.all([getAppointments(), getStorageHealth()]);

  return (
    <>
      <header className="mb-12">
        <div className="label">Appointments</div>
        <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">Your diary.</h1>
      </header>
      <StorageNotice health={storage} />
      <AppointmentsBoard initial={appointments} />
    </>
  );
}
