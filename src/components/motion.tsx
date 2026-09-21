"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

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
 * Two details keep this from fighting itself. The reveal animations translate
 * the element by up to 210px, which changes its own intersection with the root;
 * a naive `isIntersecting` handler therefore un-reveals the element mid-flight,
 * resets it and starts over, which reads as heavy flicker on a phone. So:
 *
 *  - Entering needs 12% of the element on screen, but leaving needs it fully
 *    gone (ratio 0). That hysteresis absorbs the animation's own displacement.
 *  - While a reveal is playing, "leave" is ignored outright.
 *
 * `armed` starts true so the server-rendered markup is already hidden. Without
 * that the browser paints the content, then JS hides it to animate it in — a
 * visible flash on first load. The <noscript> block in the layout restores
 * everything when JS is off, and a missing IntersectionObserver disarms below.
 */
const HAS_IO = typeof IntersectionObserver !== "undefined";
const ENTER_RATIO = 0.12;

function useInViewport(holdMs = 0): [(node: HTMLElement | null) => void, boolean, boolean] {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [state, setState] = useState({ armed: true, inView: false });
  const playingUntil = useRef(0);

  useEffect(() => {
    if (!HAS_IO) {
      setState({ armed: false, inView: false });
      return;
    }
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const now = performance.now();
        setState((prev) => {
          if (entry.intersectionRatio >= ENTER_RATIO) {
            if (!prev.inView) playingUntil.current = now + holdMs;
            return prev.inView ? prev : { armed: true, inView: true };
          }
          // Still partly on screen, or the reveal is mid-flight: hold the state.
          if (entry.intersectionRatio > 0 || now < playingUntil.current) return prev;
          return prev.inView ? { armed: true, inView: false } : prev;
        });
      },
      { threshold: [0, ENTER_RATIO], rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, holdMs]);

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
  const total = delay + (index ?? 0) * 0.11;
  const [ref, inView, armed] = useInViewport((total + duration) * 1000 + 120);
  const Element = as;

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
  const [ref, inView, armed] = useInViewport(1400);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Both modes render armed on the server, so the browser paints the words
  // already masked. Adding `in` afterwards is what the transition runs from —
  // arming and revealing in the same commit gives the browser no start state,
  // so the headline would jump into place instead of rising.
  const shown = play === "mount" ? mounted : inView;
  const hide = play === "mount" ? true : armed;
  const words = text.split(" ");

  return (
    <span
      ref={ref}
      className={`split ${hide ? "split-armed" : ""} ${shown ? "in" : ""} ${className}`}
      style={{ "--split-delay": `${delay}s` } as React.CSSProperties}
    >
      {/* Real space characters between the word masks, not a margin: adjacent
          inline-blocks with no whitespace give the browser no break opportunity
          and read as one run of text to crawlers and screen readers. */}
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="w" style={{ "--i": i } as React.CSSProperties}>
            <span>{word}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
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
