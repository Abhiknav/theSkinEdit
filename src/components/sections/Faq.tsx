"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Reveal, SectionHead } from "@/components/motion";
import { FAQS } from "@/lib/content";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="band band-tint overflow-x-clip">
      <div className="wrap">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHead label="Questions" title="Before you" accent="book." />

          <div className="border-t border-border">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={item.q} kind="up" index={i} duration={0.7}>
                  <div className="border-b border-border">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="group flex w-full items-start justify-between gap-8 py-6 text-left"
                    >
                      <span
                        className={`font-display text-[1.22rem] leading-snug transition-colors duration-300 sm:text-[1.38rem] ${
                          isOpen ? "text-copper" : "text-ink group-hover:text-copper"
                        }`}
                      >
                        {item.q}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        aria-hidden
                        className="mt-1 shrink-0 text-[1.4rem] leading-none font-light text-copper"
                      >
                        +
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: EASE }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-[62ch] pb-7 leading-relaxed text-soft">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
