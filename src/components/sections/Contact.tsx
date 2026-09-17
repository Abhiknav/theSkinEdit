import { Reveal, SectionHead } from "@/components/motion";
import { CLINIC, CONTACT } from "@/lib/content";

export function Contact() {
  return (
    <section id="contact" className="band band-cream overflow-x-clip">
      <div className="wrap">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <SectionHead
              label={CONTACT.label}
              title={CONTACT.title}
              accent={CONTACT.accent}
              lede={CONTACT.lede}
            />

            <Reveal kind="up" delay={0.15}>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#book" className="btn btn-copper">
                  Book an appointment
                  <span className="arw" aria-hidden>
                    →
                  </span>
                </a>
                <a
                  href={CLINIC.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                >
                  WhatsApp
                </a>
              </div>
            </Reveal>

            <Reveal kind="up" delay={0.22}>
              <dl className="mt-10 space-y-4 text-[0.95rem]">
                <div className="flex items-baseline gap-4">
                  <dt className="w-24 shrink-0 font-mono text-[0.62rem] tracking-[0.14em] text-faint uppercase">
                    Phone
                  </dt>
                  <dd>
                    <a href={`tel:${CLINIC.phoneHref}`} className="text-ink transition-colors hover:text-copper">
                      {CLINIC.phone}
                    </a>
                  </dd>
                </div>
                <div className="flex items-baseline gap-4">
                  <dt className="w-24 shrink-0 font-mono text-[0.62rem] tracking-[0.14em] text-faint uppercase">
                    Email
                  </dt>
                  <dd className="text-soft">
                    <a href={`mailto:${CLINIC.email}`} className="transition-colors hover:text-copper">
                      {CLINIC.email}
                    </a>
                  </dd>
                </div>
                <div className="flex items-baseline gap-4">
                  <dt className="w-24 shrink-0 font-mono text-[0.62rem] tracking-[0.14em] text-faint uppercase">
                    Location
                  </dt>
                  <dd className="text-soft">{CLINIC.city}</dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <div className="space-y-5">
            <Reveal kind="corner" duration={1.05}>
              <div className="card p-8">
                <span className="label">Consulting hours</span>
                <ul className="mt-6 space-y-4">
                  {CLINIC.timings.map((t) => (
                    <li key={t.days} className="flex items-baseline justify-between gap-6 border-b border-line pb-4 last:border-0 last:pb-0">
                      <span className="text-soft">{t.days}</span>
                      <span className="font-display text-[1.3rem] text-ink">{t.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal kind="up" delay={0.12}>
              <div className="card p-8">
                <span className="label">Where</span>
                <p className="mt-5 leading-relaxed text-soft">
                  Dr Bansal currently consults at{" "}
                  <span className="text-ink">{CLINIC.doctor.consultsAt}</span>. {CONTACT.where}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
