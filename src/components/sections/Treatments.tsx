"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Reveal, SectionHead } from "@/components/motion";
import { SERVICES } from "@/lib/content";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Treatments as an index, not a grid of boxes: pick a line on the left, the
 * detail resolves on the right. On phones the same list becomes an accordion.
 */
export function Treatments() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = SERVICES[activeIndex];

  return (
    <section id="treatments" className="band overflow-x-clip">
      <div className="wrap">
        <SectionHead
          label="Treatments"
          title="Eight things we do"
          accent="properly."
          lede="Every plan starts with a diagnosis and ends in writing — what it costs, how long it takes, and what it will realistically look like."
        />

        <div className="mt-14 grid gap-12 lg:mt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          {/* ---------- Index ---------- */}
          <ul className="border-t border-border">
            {SERVICES.map((service, i) => {
              const isActive = i === activeIndex;
              return (
                <Reveal as="li" key={service.slug} kind="up" index={i} duration={0.75}>
                  <div className="border-b border-border">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      aria-expanded={isActive}
                      className="group relative flex w-full items-center gap-5 py-5 text-left"
                    >
                      {isActive && (
                        <motion.span
                          layoutId="treatment-bar"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                          className="absolute top-2 bottom-2 -left-4 w-[2px] rounded bg-copper"
                        />
                      )}
                      <span
                        className={`font-mono text-[0.68rem] tracking-[0.1em] transition-colors duration-300 ${
                          isActive ? "text-copper" : "text-faint"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`flex-1 font-display text-[1.42rem] leading-snug transition-all duration-400 sm:text-[1.65rem] ${
                          isActive ? "translate-x-1 text-ink" : "text-soft group-hover:translate-x-1 group-hover:text-ink"
                        }`}
                      >
                        {service.name}
                      </span>
                      <span
                        className={`font-mono text-[0.6rem] tracking-[0.12em] uppercase transition-opacity duration-300 ${
                          isActive ? "text-copper opacity-100" : "text-faint opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {service.group}
                      </span>
                    </button>

                    {/* Phone: the detail unfolds in place. */}
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: EASE }}
                          className="overflow-hidden lg:hidden"
                        >
                          <Detail service={service} compact />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              );
            })}
          </ul>

          {/* ---------- Detail ---------- */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <Reveal kind="blur" duration={1}>
                <div className="card relative overflow-hidden p-10">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-8 -right-2 font-display text-[9rem] leading-none text-copper-wash select-none"
                  >
                    {String(activeIndex + 1).padStart(2, "0")}
                  </span>
                    <motion.div
                      key={active.slug}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="relative"
                    >
                      <Detail service={active} />
                  </motion.div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Detail({ service, compact = false }: { service: (typeof SERVICES)[number]; compact?: boolean }) {
  return (
    <div className={compact ? "pt-1 pb-7" : ""}>
      <span className="label">{service.group}</span>
      <p
        className={`accent mt-4 ${compact ? "text-[1.15rem]" : "text-[1.45rem]"} leading-snug`}
      >
        {service.line}
      </p>
      <p className={`mt-4 leading-relaxed text-soft ${compact ? "text-[0.94rem]" : ""}`}>
        {service.body}
      </p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {service.includes.map((item) => (
          <li key={item} className="chip">
            {item}
          </li>
        ))}
      </ul>
      <a href="#book" className="btn btn-ghost mt-7">
        Book for this
        <span className="arw" aria-hidden>
          →
        </span>
      </a>
    </div>
  );
}
