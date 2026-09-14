import { Reveal, SectionHead } from "@/components/motion";
import { FeedbackForm } from "@/components/site/FeedbackForm";
import { Ribbon } from "@/components/site/Ribbon";
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

function Note({ item }: { item: TestimonialItem }) {
  return (
    <figure className="card flex h-full w-[19rem] flex-col gap-4 p-6 sm:w-[23rem]">
      <Stars rating={item.rating} />
      <blockquote className="font-display text-[1.12rem] leading-snug whitespace-normal text-ink">
        “{item.comment}”
      </blockquote>
      <figcaption className="mt-auto font-mono text-[0.58rem] tracking-[0.14em] text-faint uppercase">
        {item.name}
      </figcaption>
    </figure>
  );
}

export function Voices({ testimonials }: { testimonials: TestimonialItem[] }) {
  const isSample = testimonials.length === 0;
  const items = isSample ? SAMPLE_TESTIMONIALS : testimonials;
  /** A ribbon needs enough cards to fill the track twice over. */
  const filled = items.length >= 4 ? items : [...items, ...items, ...items].slice(0, 6);

  return (
    <section id="voices" className="band overflow-x-clip">
      <div className="wrap">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.72fr] lg:gap-16">
          <div className="min-w-0">
            <SectionHead label="Voices" title="What patients" accent="say." />
            {isSample && (
              <Reveal kind="fade" delay={0.1}>
                <p className="mt-7 inline-flex rounded-full border border-copper-soft bg-copper-wash px-4 py-2 font-mono text-[0.62rem] tracking-[0.12em] text-copper uppercase">
                  Placeholder — real notes appear once approved
                </p>
              </Reveal>
            )}
          </div>

          <Reveal kind="up" delay={0.1} className="min-w-0">
            <FeedbackForm />
          </Reveal>
        </div>
      </div>

      {/* Full-bleed so the notes run past the page gutters. */}
      <Reveal kind="fade" duration={0.9} className="mt-14">
        <Ribbon
          items={filled.map((item) => <Note key={item.id} item={item} />)}
          separator={false}
          itemClassName="px-3"
          duration={64}
        />
      </Reveal>
    </section>
  );
}
