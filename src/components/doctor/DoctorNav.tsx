"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Brand } from "@/components/site/Brand";

const LINKS = [
  { href: "/doctor/appointments", label: "Appointments" },
  { href: "/doctor/availability", label: "Availability" },
  { href: "/doctor/feedback", label: "Feedback" },
];

export function DoctorNav({ signedIn, email }: { signedIn: boolean; email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/doctor/login", { method: "DELETE" });
    router.replace("/doctor");
    router.refresh();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-tint/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="shrink-0">
          <Brand size="sm" stacked />
        </Link>

        {signedIn && (
          <nav className="order-3 flex w-full gap-7 sm:order-2 sm:w-auto">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative pb-1 text-[0.68rem] tracking-[0.18em] uppercase transition-colors ${
                    active ? "text-copper" : "text-soft hover:text-ink"
                  }`}
                >
                  {link.label}
                  {active && <span className="absolute inset-x-0 -bottom-0.5 h-px bg-copper" />}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="order-2 flex items-center gap-5 sm:order-3">
          {signedIn ? (
            <>
              <span className="hidden text-xs text-faint md:inline">{email}</span>
              <button
                type="button"
                onClick={signOut}
                className="text-[0.66rem] tracking-[0.18em] text-faint uppercase transition-colors hover:text-copper"
              >
                Sign out
              </button>
            </>
          ) : (
            <span className="text-[0.66rem] tracking-[0.18em] text-faint uppercase">Practice dashboard</span>
          )}
        </div>
      </div>
    </header>
  );
}
