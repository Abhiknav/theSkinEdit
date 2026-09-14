import { redirect } from "next/navigation";

import { LoginForm } from "@/components/doctor/LoginForm";
import { getSession } from "@/server/auth/doctor";

export const dynamic = "force-dynamic";

export default async function DoctorLoginPage() {
  const session = await getSession();
  if (session) redirect("/doctor/appointments");

  return <LoginForm devHint={process.env.NODE_ENV !== "production" && !process.env.DOCTOR_PASSWORD} />;
}
