import { Ribbon } from "@/components/site/Ribbon";
import { RIBBON } from "@/lib/content";

/** A moving strip of what she treats — keeps the page alive between sections. */
export function ExpertiseRibbon() {
  return (
    <section aria-label="What Dr Bansal treats" className="band-deep overflow-hidden py-6">
      <Ribbon items={[...RIBBON]} tone="deep" duration={46} />
    </section>
  );
}
