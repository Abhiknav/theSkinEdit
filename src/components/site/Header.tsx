"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useState } from "react";

import { Brand } from "@/components/site/Brand";
import { CLINIC, NAV } from "@/lib/content";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 20));

  // Scroll spy — the nav always says where you are on the page.
  useEffect(() => {
    const ids = NAV.map((n) => n.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.6] },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={`transition-all duration-500 ${
            scrolled || open
              ? "border-b border-border/70 bg-paper/85 py-2.5 backdrop-blur-xl"
              : "border-b border-transparent py-4"
          }`}
        >
          <div className="wrap flex items-center justify-between gap-6">
            <a href="#top" aria-label="The Skin Edit — top of page" className="shrink-0">
              <Brand size="sm" stacked />
            </a>

            <nav className="hidden items-center gap-1 lg:flex">
              {NAV.map((item) => {
                const isActive = active === item.href.slice(1);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`relative rounded-full px-4 py-2 text-[0.86rem] transition-colors duration-300 ${
                      isActive ? "text-ink" : "text-soft hover:text-ink"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        className="absolute inset-0 rounded-full bg-copper-wash"
                      />
                    )}
                    <span className="relative">{item.label}</span>
                  </a>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <a href="#book" className="btn btn-primary px-5 py-3 text-[0.8rem] sm:px-7 sm:py-[15px] sm:text-[0.88rem]">
                Book
                <span className="arw" aria-hidden>
                  →
                </span>
              </a>

              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="flex h-11 w-11 flex-col items-center justify-center gap-[6px] rounded-full border border-border lg:hidden"
              >
                <motion.span
                  animate={open ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="block h-[1.5px] w-[18px] rounded bg-ink"
                />
                <motion.span
                  animate={open ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="block h-[1.5px] w-[18px] rounded bg-ink"
                />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-paper px-8 lg:hidden"
          >
            <nav className="flex flex-col">
              {[...NAV, { href: "#book", label: "Book appointment" }].map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 * i + 0.08, ease: EASE }}
                  className="border-b border-line py-5 font-display text-[2rem] text-ink transition-colors hover:text-copper"
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            <motion.a
              href={`tel:${CLINIC.phoneHref}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="label mt-10"
            >
              {CLINIC.phone}
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
