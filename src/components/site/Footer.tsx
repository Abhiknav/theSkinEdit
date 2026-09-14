import Link from "next/link";

import { Brand } from "@/components/site/Brand";
import { CLINIC, NAV } from "@/lib/content";

export function Footer() {
  return (
    <footer className="band-deep">
      <div className="wrap py-16">
        <div className="flex flex-col gap-10 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <Brand stacked className="[&_.bg-border]:bg-white/20" />
            <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-soft">
              Dermatology, trichology and aesthetic medicine in {CLINIC.city} — practised slowly,
              explained fully.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-7 gap-y-3">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[0.9rem] text-soft transition-colors hover:text-copper"
              >
                {item.label}
              </a>
            ))}
            <a
              href={`tel:${CLINIC.phoneHref}`}
              className="text-[0.9rem] text-soft transition-colors hover:text-copper"
            >
              {CLINIC.phone}
            </a>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-4 text-[0.78rem] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {CLINIC.brand} · {CLINIC.doctor.name},{" "}
            {CLINIC.doctor.registration}
          </p>
          <p className="max-w-lg">
            Booking details only — no medical records are stored here. Consent recorded at booking
            under the DPDP Act 2023.{" "}
            <Link href="/doctor" className="text-soft transition-colors hover:text-copper">
              Doctor sign in
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
