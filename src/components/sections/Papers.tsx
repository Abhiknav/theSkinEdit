import { Reveal, SectionHead } from "@/components/motion";
import { PAPERS } from "@/lib/content";

export function Papers() {
  return (
    <section id="papers" className="band band-deep grain overflow-x-clip">
      <div className="wrap">
        <SectionHead
          label={PAPERS.label}
          title={PAPERS.title}
          accent={PAPERS.accent}
          lede={PAPERS.lede}
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="min-w-0 space-y-12">
            <div>
              <Reveal kind="fade" duration={0.7}>
                <h3 className="font-mono text-[0.68rem] tracking-[0.18em] text-copper uppercase">
                  Publications
                </h3>
              </Reveal>

              <ul className="mt-7 divide-y divide-border border-y border-border">
                {PAPERS.publications.map((entry, i) => (
                  <Reveal as="li" key={entry.title} kind="clip" index={i} duration={0.85}>
                    <div className="flex gap-5 py-6 sm:gap-6">
                      <span className="shrink-0 font-mono text-[0.66rem] text-copper">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-display text-[1.15rem] leading-snug sm:text-[1.3rem]">
                          {entry.title}
                        </h4>
                        <p className="mt-1.5 text-[0.92rem] leading-relaxed text-soft">
                          {entry.detail}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>

            {/* Deliberately compact — venue and topic on two tight lines. */}
            <div>
              <Reveal kind="fade" duration={0.7}>
                <h3 className="font-mono text-[0.68rem] tracking-[0.18em] text-copper uppercase">
                  Conference presentations
                </h3>
              </Reveal>

              <ul className="mt-7 space-y-3.5">
                {PAPERS.presentations.map((entry, i) => (
                  <Reveal as="li" key={entry.venue} kind="up" index={i} duration={0.7}>
                    <div className="border-b border-border pb-3.5 last:border-0 last:pb-0">
                      <p className="text-[0.92rem] leading-snug text-ink">{entry.venue}</p>
                      <p className="mt-1 text-[0.88rem] leading-snug text-soft">{entry.topic}</p>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>

          <div className="min-w-0 space-y-12">
            <div>
              <Reveal kind="fade" duration={0.7}>
                <h3 className="font-mono text-[0.68rem] tracking-[0.18em] text-copper uppercase">
                  Recognition
                </h3>
              </Reveal>

              <ul className="mt-7 space-y-4">
                {PAPERS.recognition.map((entry, i) => (
                  <Reveal as="li" key={entry.text} kind="up" index={i} duration={0.75}>
                    <div className="flex gap-5 border-b border-border pb-4">
                      <span className="w-10 shrink-0 font-mono text-[0.64rem] text-copper">
                        {entry.year}
                      </span>
                      <span className="min-w-0 text-[0.93rem] leading-relaxed text-soft">
                        {entry.text}
                      </span>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>

            {/* Roles are not awards — kept in their own list so neither inflates the other. */}
            <div>
              <Reveal kind="fade" duration={0.7}>
                <h3 className="font-mono text-[0.68rem] tracking-[0.18em] text-copper uppercase">
                  Professional roles
                </h3>
              </Reveal>

              <dl className="mt-7 space-y-4">
                {PAPERS.roles.map((entry, i) => (
                  <Reveal key={entry.role} kind="up" index={i} duration={0.75}>
                    <div className="border-b border-border pb-4">
                      <dt className="font-display text-[1.12rem] leading-snug">{entry.role}</dt>
                      <dd className="mt-1 text-[0.92rem] leading-relaxed text-soft">
                        {entry.detail}
                      </dd>
                    </div>
                  </Reveal>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
