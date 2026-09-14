import { Reveal, SectionHead } from "@/components/motion";
import { FeedbackForm } from "@/components/site/FeedbackForm";
import { SAMPLE_TESTIMONIALS } from "@/lib/content";

export interface TestimonialItem {
  id: string;
  name: string;
  rating: number;
  comment: string;
  publishedAt: string | null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 text-copper" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? "opacity-100" : "opacity-25"}>
          ✦
        </span>
      ))}
    </div>
  );
}

export function Voices({ testimonials }: { testimonials: TestimonialItem[] }) {
  const isSample = testimonials.length === 0;
  const items = isSample ? SAMPLE_TESTIMONIALS : testimonials.slice(0, 3);

  return (
    <section id="voices" className="band overflow-x-clip">
      <div className="wrap">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <SectionHead
              label="Voices"
              title="What patients"
              accent="say."
              lede="Feedback is requested after every appointment, read by Dr Bansal, and published only if she approves it."
            />

            {isSample && (
              <Reveal kind="fade" delay={0.1}>
                <p className="mt-8 inline-flex rounded-full border border-copper-soft bg-copper-wash px-4 py-2 font-mono text-[0.62rem] tracking-[0.12em] text-copper uppercase">
                  Placeholder — real notes appear once approved
                </p>
              </Reveal>
            )}

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {items.map((item, i) => (
                <Reveal key={item.id} kind={i % 2 === 0 ? "cornerLeft" : "corner"} index={i} duration={1}>
                  <figure className="card flex h-full flex-col gap-5 p-7">
                    <Stars rating={item.rating} />
                    <blockquote className="font-display text-[1.22rem] leading-snug text-ink">
                      “{item.comment}”
                    </blockquote>
                    <figcaption className="mt-auto font-mono text-[0.6rem] tracking-[0.14em] text-faint uppercase">
                      {item.name}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal kind="up" delay={0.12}>
            <div className="lg:sticky lg:top-28">
              <FeedbackForm />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
