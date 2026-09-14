"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

import { SplitText } from "@/components/motion";
import { CLINIC, HERO, HERO_FACTS } from "@/lib/content";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "26%"]);
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "10%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduced ? 1 : 0.2]);

  return (
    <section
      id="top"
      ref={ref}
      className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-16"
    >
      {/* Warm light, drifting slowly behind everything. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 -z-10 h-[42rem] w-[42rem] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, rgba(207,130,79,0.30), rgba(243,233,221,0.35) 45%, transparent 70%)",
        }}
        animate={reduced ? undefined : { x: [0, 28, 0], y: [0, -22, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 -z-10 h-[34rem] w-[34rem] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(231,195,169,0.40), transparent 68%)",
        }}
        animate={reduced ? undefined : { x: [0, -22, 0], y: [0, 18, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="wrap w-full">
        <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
          {/* ---------- Copy ---------- */}
          <motion.div style={{ y: textY, opacity: fade }} className="order-2 lg:order-1">
            <motion.span
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
              className="label"
            >
              {HERO.label}
            </motion.span>

            <h1 className="display mt-6">
              <SplitText text={HERO.title} play="mount" delay={0.3} />
              <br />
              <SplitText text={HERO.accent} play="mount" delay={0.52} className="accent" />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.85, ease: EASE }}
              className="lede mt-5 sm:mt-7"
            >
              {HERO.sub}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1, ease: EASE }}
              className="mt-7 flex flex-wrap items-center gap-3 sm:mt-9"
            >
              <a href="#book" className="btn btn-primary">
                {HERO.cta}
                <span className="arw" aria-hidden>
                  →
                </span>
              </a>
              <a href="#about" className="btn btn-ghost">
                {HERO.ctaSecondary}
              </a>
            </motion.div>

            {/* Four facts, no boasting. */}
            <motion.dl
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.15, ease: EASE }}
              className="mt-10 grid max-w-xl sm:mt-12 grid-cols-2 gap-x-6 gap-y-7 border-t border-border pt-8 sm:grid-cols-4"
            >
              {HERO_FACTS.map((fact) => (
                <div key={fact.label}>
                  <dt className="font-display text-[1.45rem] leading-none text-ink">{fact.value}</dt>
                  <dd className="mt-2 font-mono text-[0.62rem] tracking-[0.14em] text-faint uppercase">
                    {fact.label}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          {/* ---------- Portrait ---------- */}
          <motion.div style={{ y: photoY }} className="order-1 lg:order-2">
            <div className="relative mx-auto w-full max-w-[16.5rem] sm:max-w-[21rem] lg:max-w-[27rem]">
              {/* Offset frame behind the arch. */}
              <motion.div
                aria-hidden
                initial={{ opacity: 0, x: 30, y: 30 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 1.2, delay: 0.45, ease: EASE }}
                className="arch absolute inset-0 translate-x-5 translate-y-5 border border-copper-soft/70 bg-cream/60"
              />

              <motion.div
                initial={{ clipPath: "inset(100% 0% 0% 0%)", scale: 1.06 }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
                transition={{ duration: 1.5, delay: 0.35, ease: EASE }}
                className="arch relative aspect-[646/703] w-full bg-cream shadow-[var(--shadow-lg)]"
              >
                <Image
                  src={CLINIC.doctor.photo}
                  alt={`${CLINIC.doctor.name}, dermatologist`}
                  fill
                  priority
                  sizes="(max-width: 640px) 17rem, (max-width: 1024px) 21rem, 27rem"
                  className="object-cover object-top"
                />
                {/* Warms the neutral background of the photograph. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(180,105,63,0.10) 0%, rgba(180,105,63,0) 32%, rgba(14,24,34,0.30) 100%)",
                  }}
                />
              </motion.div>

              {/* Name plate, floating over the lower edge. */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.15, ease: EASE }}
                className="card absolute right-2 -bottom-7 left-2 px-5 py-4 backdrop-blur-sm sm:right-6 sm:left-6"
              >
                <p className="font-display text-[1.3rem] leading-tight text-ink">
                  {CLINIC.doctor.name}
                </p>
                <p className="mt-1 font-mono text-[0.6rem] tracking-[0.14em] text-faint uppercase">
                  {CLINIC.doctor.title}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#about"
        aria-label="Scroll to about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-faint lg:flex"
      >
        <span className="font-mono text-[0.58rem] tracking-[0.24em] uppercase">Scroll</span>
        <motion.span
          animate={{ scaleY: [0.25, 1, 0.25] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="block h-9 w-px origin-top bg-copper/60"
        />
      </motion.a>
    </section>
  );
}
