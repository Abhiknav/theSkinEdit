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
          lede="She writes for the literature as well as reviewing it — a rare combination outside academic medicine."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="min-w-0">
            <ul className="divide-y divide-border border-y border-border">
              {PAPERS.publications.map((entry, i) => (
                <Reveal as="li" key={entry.title} kind="clip" index={i} duration={0.85}>
                  <div className="flex gap-6 py-6">
                    <span className="font-mono text-[0.66rem] text-copper">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-[1.3rem] leading-snug">{entry.title}</h3>
                      <p className="mt-1.5 text-[0.92rem] leading-relaxed text-soft">{entry.detail}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
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
                    <span className="text-[0.93rem] leading-relaxed text-soft">{entry.text}</span>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
