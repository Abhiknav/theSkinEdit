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
              <div className="mt-9 flex flex-wrap gap-2.5">
                {ABOUT.credentials.map((credential) => (
                  <span key={credential} className="chip">
                    {credential}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal kind="up" delay={0.28}>
              <p className="mt-8 font-mono text-[0.68rem] tracking-[0.14em] text-faint uppercase">
                {CLINIC.doctor.registration} · Consults in {CLINIC.doctor.languages.join(", ")}
              </p>
            </Reveal>
          </div>

          <div className="space-y-6">
            <Reveal kind="corner" duration={1.05}>
              <div className="band-deep rounded-[22px] p-8 sm:p-9">
                <span className="label">Distinction</span>
                <h3 className="mt-5 font-display text-[1.75rem] leading-tight">
                  {ABOUT.distinction.title}
                </h3>
                <p className="mt-4 text-[0.97rem] leading-relaxed text-soft">
                  {ABOUT.distinction.body}
                </p>
              </div>
            </Reveal>

            {/* Her posts and awards live in the Papers section — this just points there. */}
            <Reveal kind="up" delay={0.12}>
              <div className="card p-8">
                <span className="label">Also</span>
                <p className="mt-5 leading-relaxed text-soft">
                  Board member of the IADVL Special Interest Group in Aesthetics, and a reviewer for
                  the Journal of the American Academy of Dermatology.
                </p>
                <a href="#papers" className="btn btn-ghost mt-6">
                  Papers &amp; recognition
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
