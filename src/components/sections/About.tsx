import { Reveal, SectionHead } from "@/components/motion";
import { ABOUT, CLINIC } from "@/lib/content";

export function About() {
  return (
    <section id="about" className="band band-tint overflow-x-clip">
      <div className="wrap">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <SectionHead label={ABOUT.label} title={ABOUT.title} accent={ABOUT.accent} />

            <div className="mt-8 space-y-5">
              {ABOUT.body.map((paragraph, i) => (
                <Reveal key={i} kind="up" delay={0.08 + i * 0.08} duration={0.85}>
                  <p className="lede max-w-[56ch]">{paragraph}</p>
                </Reveal>
              ))}
            </div>

            <Reveal kind="up" delay={0.2}>
              <ul className="mt-9 flex flex-wrap gap-2.5">
                {ABOUT.credentials.map((credential) => (
                  <li key={credential} className="chip">
                    {credential}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Registration and languages read as two separate facts, not one run-on line. */}
            <Reveal kind="up" delay={0.28}>
              <dl className="mt-8 space-y-2 font-mono text-[0.68rem] tracking-[0.14em] text-faint uppercase">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="sr-only">Medical registration</dt>
                  <dd>{CLINIC.doctor.registration}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt>Languages:</dt>
                  <dd>{CLINIC.doctor.languages.join(" · ")}</dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <div className="space-y-6">
            <Reveal kind="corner" duration={1.05}>
              <div className="band-deep rounded-[22px] p-8 sm:p-9">
                <span className="label label-wrap">{ABOUT.distinction.label}</span>
                <h3 className="mt-5 font-display text-[1.6rem] leading-tight sm:text-[1.75rem]">
                  {ABOUT.distinction.title}
                </h3>
                <p className="mt-4 text-[0.97rem] leading-relaxed text-soft">
                  {ABOUT.distinction.body}
                </p>
              </div>
            </Reveal>

            {/* Awards live in the Papers section — this carries the standing roles. */}
            <Reveal kind="up" delay={0.12}>
              <div className="card p-8">
                <span className="label">Professional roles</span>
                <dl className="mt-5 space-y-4">
                  {ABOUT.roles.map((item) => (
                    <div key={item.role}>
                      <dt className="font-display text-[1.12rem] leading-snug text-ink">
                        {item.role}
                      </dt>
                      <dd className="mt-1 text-[0.93rem] leading-relaxed text-soft">{item.detail}</dd>
                    </div>
                  ))}
                </dl>
                <a href="#papers" className="btn btn-ghost mt-6">
                  Publications &amp; recognition
                  <span className="arw" aria-hidden>
                    →
                  </span>
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
