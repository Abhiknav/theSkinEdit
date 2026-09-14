import type { Metadata } from "next";

import { DoctorNav } from "@/components/doctor/DoctorNav";
import { getSession } from "@/server/auth/doctor";

export const metadata: Metadata = {
  title: "Practice dashboard",
  robots: { index: false, follow: false },
};

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-tint">
      <DoctorNav signedIn={Boolean(session)} email={session?.email ?? null} />
      <div className="mx-auto max-w-[76rem] px-5 pt-32 pb-24 sm:px-8">{children}</div>
    </div>
  );
}
