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
/**
 * Approved notes lead, the form follows.
 *
 * The form used to sit beside the heading, which on a phone put "write us a
 * review" above the reviews themselves — asking before showing. Reading what
 * other patients said is the reason to be in this section; contributing is the
 * afterthought, so it comes last.
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
        <SectionHead label={VOICES.label} title={VOICES.title} accent={VOICES.accent} />
        {!hasNotes && (
          <Reveal kind="up" delay={0.1} duration={0.8}>
            <p className="lede mt-7 max-w-[46ch]">{VOICES.empty}</p>
          </Reveal>
        )}
      </div>

      {/* Full-bleed so the notes run past the page gutters. */}
      {hasNotes && (
        <Reveal kind="fade" duration={0.9} className="mt-12">
          <Ribbon
            items={filled.map((item, i) => <Note key={`${item.id}-${i}`} item={item} />)}
            separator={false}
            itemClassName="px-3"
            duration={64}
          />
        </Reveal>
      )}

      <div className="wrap">
        <Reveal kind="up" delay={0.1} className={hasNotes ? "mt-14" : "mt-12"}>
          <div className="mx-auto max-w-xl">
            <FeedbackForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
