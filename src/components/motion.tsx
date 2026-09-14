"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Scroll-reveal system.
 *
 * Deliberately characterful: things arrive from corners, tilt into place,
 * de-blur or wipe. The animation itself is CSS (see globals.css) and this only
 * toggles an `.in` class, which means a reveal replays every time the element
 * re-enters the viewport rather than firing once and staying put.
 */

export type RevealKind =
  | "up"
  | "down"
  | "left"
  | "right"
  | "corner"
  | "cornerLeft"
  | "tilt"
  | "blur"
  | "clip"
  | "scale"
  | "fade";

/**
 * True whenever the element is on screen — not just the first time.
 *
 * `armed` is only set from inside the observer callback, and the CSS keeps
 * content visible until then. So if IntersectionObserver never reports (an old
 * browser, a throttled background tab, JS that failed to run), the page reads as
 * plain un-animated content rather than going blank.
 */
function useInViewport(): [(node: HTMLElement | null) => void, boolean, boolean] {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [state, setState] = useState({ armed: false, inView: false });

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setState({ armed: true, inView: entry.isIntersecting }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [setNode, state.inView, state.armed];
}

type Tag = "div" | "li" | "section" | "article" | "span";

export function Reveal({
  children,
  kind = "up",
  delay = 0,
  index,
  duration = 0.95,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  kind?: RevealKind;
  delay?: number;
  /** Position in a group — turns into a stagger without a parent wrapper. */
  index?: number;
  duration?: number;
  className?: string;
  as?: Tag;
}) {
  const [ref, inView, armed] = useInViewport();
  const Element = as;
  const total = delay + (index ?? 0) * 0.11;

  return (
    <Element
      ref={ref}
      data-rv={kind}
      className={`rv ${armed ? "rv-armed" : ""} ${inView ? "in" : ""} ${className}`}
      style={
        {
          "--rv-delay": `${total}s`,
          "--rv-duration": `${duration}s`,
        } as React.CSSProperties
      }
    >
      {children}
    </Element>
  );
}

/** Headline treatment: words rise out of their own clipping mask. */
export function SplitText({
  text,
  className = "",
  delay = 0,
  play = "view",
}: {
  text: string;
  className?: string;
  delay?: number;
  /** "mount" for above-the-fold copy, "view" for everything further down. */
  play?: "mount" | "view";
}) {
  const [ref, inView, armed] = useInViewport();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const shown = play === "mount" ? mounted : inView;
  const hide = play === "mount" ? mounted : armed;
  const words = text.split(" ");

  return (
    <span
      ref={ref}
      className={`split ${hide ? "split-armed" : ""} ${shown ? "in" : ""} ${className}`}
      style={{ "--split-delay": `${delay}s` } as React.CSSProperties}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={`w${i < words.length - 1 ? " mr-[0.26em]" : ""}`}
          style={{ "--i": i } as React.CSSProperties}
        >
          <span>{word}</span>
        </span>
      ))}
    </span>
  );
}

/** Section heading: mono label, display heading, optional lede. */
export function SectionHead({
  label,
  title,
  accent,
  lede,
  align = "left",
  className = "",
}: {
  label: string;
  title: string;
  accent?: string;
  lede?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}>
      <Reveal kind="fade" duration={0.7}>
        <span className={`label ${align === "center" ? "justify-center" : ""}`}>{label}</span>
      </Reveal>
      <h2 className="h2 mt-5">
        <SplitText text={title} />
        {accent && (
          <>
            {" "}
            <SplitText text={accent} className="accent" delay={0.12} />
          </>
        )}
      </h2>
      {lede && (
        <Reveal kind="up" delay={0.12} duration={0.8}>
          <p className={`lede mt-5 ${align === "center" ? "mx-auto" : ""}`}>{lede}</p>
        </Reveal>
      )}
    </div>
  );
}
