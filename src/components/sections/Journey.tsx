import { Reveal, SectionHead } from "@/components/motion";
import { EDUCATION, EXPERIENCE, JOURNEY } from "@/lib/content";

export function Journey() {
  return (
    <section id="journey" className="band band-tint overflow-x-clip">
      <div className="wrap">
        <SectionHead
          label={JOURNEY.label}
          title={JOURNEY.title}
          accent={JOURNEY.accent}
          lede={JOURNEY.lede}
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <Reveal kind="fade" duration={0.7}>
              <h3 className="font-mono text-[0.68rem] tracking-[0.18em] text-copper uppercase">
                Practice
              </h3>
            </Reveal>

            <ol className="mt-7 border-l border-border pl-6">
              {EXPERIENCE.map((entry, i) => (
                <Reveal as="li" key={`${entry.place}-${i}`} kind="left" index={i} duration={0.8}>
                  <div className="relative pb-8 last:pb-0">
                    <span
                      aria-hidden
                      className={`absolute top-[0.55rem] -left-[1.71rem] h-2 w-2 rounded-full ${
                        i === 0 ? "bg-copper ring-4 ring-copper-wash" : "bg-border"
                      }`}
                    />
                    <div className="font-mono text-[0.6rem] tracking-[0.14em] text-faint uppercase">
                      {entry.period}
                    </div>
                    <div className="mt-1.5 font-display text-[1.25rem] leading-snug text-ink">
                      {entry.role}
                    </div>
                    <div className="mt-1 text-[0.92rem] leading-relaxed text-soft">{entry.place}</div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <div className="min-w-0">
            <Reveal kind="fade" duration={0.7}>
              <h3 className="font-mono text-[0.68rem] tracking-[0.18em] text-copper uppercase">
                Education &amp; qualifications
              </h3>
            </Reveal>

            <ol className="mt-7 space-y-3">
              {EDUCATION.map((entry, i) => (
                <Reveal as="li" key={`${entry.year}-${entry.title}`} kind="right" index={i} duration={0.8}>
                  <div className="card p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="min-w-0 font-display text-[1.2rem] leading-snug text-ink">
                        {entry.title}
                      </span>
                      <span className="shrink-0 font-mono text-[0.68rem] text-copper">{entry.year}</span>
                    </div>
                    <p className="mt-2 text-[0.9rem] leading-relaxed text-soft">{entry.detail}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
