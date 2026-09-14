"use client";

import { motion, useReducedMotion, type TargetAndTransition, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll-reveal system.
 *
 * Deliberately characterful: things arrive from corners, tilt into place, wipe
 * or de-blur. Subtle enough to feel expensive, big enough to be noticed.
 * Every variant collapses to a plain fade under prefers-reduced-motion.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

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

const FROM: Record<RevealKind, TargetAndTransition> = {
  up: { opacity: 0, y: 84 },
  down: { opacity: 0, y: -64 },
  left: { opacity: 0, x: -130 },
  right: { opacity: 0, x: 130 },
  corner: { opacity: 0, x: 210, y: 110, rotate: 7, scale: 0.9 },
  cornerLeft: { opacity: 0, x: -210, y: 110, rotate: -7, scale: 0.9 },
  tilt: { opacity: 0, rotateX: 26, y: 90, scale: 0.95 },
  blur: { opacity: 0, y: 64, filter: "blur(14px)" },
  clip: { opacity: 0, y: 26, clipPath: "inset(0% 0% 100% 0%)" },
  scale: { opacity: 0, scale: 0.72, y: 54 },
  fade: { opacity: 0 },
};

const TO: Record<RevealKind, TargetAndTransition> = {
  up: { opacity: 1, y: 0 },
  down: { opacity: 1, y: 0 },
  left: { opacity: 1, x: 0 },
  right: { opacity: 1, x: 0 },
  corner: { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 },
  cornerLeft: { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 },
  tilt: { opacity: 1, rotateX: 0, y: 0, scale: 1 },
  blur: { opacity: 1, y: 0, filter: "blur(0px)" },
  clip: { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" },
  scale: { opacity: 1, scale: 1, y: 0 },
  fade: { opacity: 1 },
};

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
  as?: "div" | "li" | "section" | "article" | "span";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];
  const total = delay + (index ?? 0) * 0.11;

  return (
    <Tag
      className={className}
      initial={reduced ? { opacity: 0 } : FROM[kind]}
      whileInView={reduced ? { opacity: 1 } : TO[kind]}
      viewport={{ once: true, margin: "-8% 0px -10% 0px" }}
      transition={{ duration: reduced ? 0.3 : duration, delay: total, ease: EASE }}
      style={kind === "tilt" ? { perspective: 1000, transformStyle: "preserve-3d" } : undefined}
    >
      {children}
    </Tag>
  );
}

/** Headline treatment: words rise out of their own clipping mask. */
export function SplitText({
  text,
  className = "",
  delay = 0,
  play = "view",
  stagger = 0.062,
}: {
  text: string;
  className?: string;
  delay?: number;
  /** "mount" for above-the-fold copy, "view" for everything further down. */
  play?: "mount" | "view";
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{text}</span>;

  const words = text.split(" ");
  const animateProps =
    play === "mount"
      ? { animate: "show" as const }
      : { whileInView: "show" as const, viewport: { once: true, margin: "-12% 0px" } };

  const parent: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const child: Variants = {
    hidden: { y: "112%" },
    show: { y: 0, transition: { duration: 0.9, ease: EASE } },
  };

  return (
    <motion.span className={className} variants={parent} initial="hidden" {...animateProps}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={`inline-block overflow-hidden pb-[0.08em] align-bottom${i < words.length - 1 ? " mr-[0.26em]" : ""}`}
        >
          <motion.span className="inline-block" variants={child}>
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
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
    <div
      className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}
    >
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
