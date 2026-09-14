import { Reveal, SectionHead } from "@/components/motion";
import { APPROACH } from "@/lib/content";

export function Approach() {
  return (
    <section id="approach" className="band band-deep grain overflow-x-clip">
      <div className="wrap relative">
        <SectionHead label={APPROACH.label} title={APPROACH.title} accent={APPROACH.accent} />

        <div className="mt-14 grid gap-px overflow-hidden rounded-[22px] border border-border bg-border md:grid-cols-3">
          {APPROACH.items.map((item, i) => (
            <Reveal key={item.n} kind="tilt" index={i} duration={1}>
              <div className="h-full bg-deep-2 p-9">
                <span className="font-display text-[2.6rem] leading-none text-copper italic">{item.n}</span>
                <h3 className="mt-6 font-display text-[1.55rem]">{item.title}</h3>
                <p className="mt-3.5 leading-relaxed text-soft">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
