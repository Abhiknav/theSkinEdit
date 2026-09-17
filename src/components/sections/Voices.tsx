import { Reveal, SectionHead } from "@/components/motion";
import { FeedbackForm } from "@/components/site/FeedbackForm";
import { Ribbon } from "@/components/site/Ribbon";
import { VOICES } from "@/lib/content";

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
        <span key={i} className={i < rating ? "opacity-100" : "opacity-25"} aria-hidden>
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

/**
 * Only genuine, doctor-approved notes are ever shown. With none published yet
 * the ribbon is simply not rendered — no sample cards, no filler quotes.
 */
export function Voices({ testimonials }: { testimonials: TestimonialItem[] }) {
  const hasNotes = testimonials.length > 0;
  /** A ribbon needs enough cards to fill the track twice over. */
  const filled =
    testimonials.length >= 4
      ? testimonials
      : [...testimonials, ...testimonials, ...testimonials].slice(0, 6);

  return (
    <section id="voices" className="band overflow-x-clip">
      <div className="wrap">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.72fr] lg:gap-16">
          <div className="min-w-0">
            <SectionHead label={VOICES.label} title={VOICES.title} accent={VOICES.accent} />
            {!hasNotes && (
              <Reveal kind="up" delay={0.1} duration={0.8}>
                <p className="lede mt-7 max-w-[46ch]">{VOICES.empty}</p>
              </Reveal>
            )}
          </div>

          <Reveal kind="up" delay={0.1} className="min-w-0">
            <FeedbackForm />
          </Reveal>
        </div>
      </div>

      {/* Full-bleed so the notes run past the page gutters. */}
      {hasNotes && (
        <Reveal kind="fade" duration={0.9} className="mt-14">
          <Ribbon
            items={filled.map((item, i) => <Note key={`${item.id}-${i}`} item={item} />)}
            separator={false}
            itemClassName="px-3"
            duration={64}
          />
        </Reveal>
      )}
    </section>
  );
}
