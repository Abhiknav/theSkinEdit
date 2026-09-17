"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";

import { Reveal, SectionHead } from "@/components/motion";
import { SERVICES } from "@/lib/content";

const EASE = [0.16, 1, 0.3, 1] as const;
const ITEM_H = 62;
/** Items further than this from the centre are rotated out of sight. */
const VISIBLE = 3;

/**
 * Treatments as a vertical wheel: the list curves away from the centre in 3D,
 * the selected item sits in the copper band, and the detail resolves alongside.
 * Click any visible item, use the arrows, or the arrow keys.
 */
export function Treatments() {
  const [active, setActive] = useState(0);
  const service = SERVICES[active];

  // Wraps around, so the wheel always has items above and below the centre.
  const move = useCallback((delta: number) => {
    setActive((i) => (i + delta + SERVICES.length) % SERVICES.length);
  }, []);

  return (
    <section id="treatments" className="band overflow-x-clip">
      <div className="wrap">
        <SectionHead
          label="Treatments"
          title="What we"
          accent="treat"
          lede="Every consultation starts with understanding the problem. Treatment is then tailored to the diagnosis, your goals and what is realistically appropriate for your skin, hair or scalp."
        />

        <div className="mt-14 grid gap-10 lg:mt-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          {/* ---------------- Wheel ---------------- */}
          <Reveal kind="cornerLeft" duration={1} className="min-w-0">
            <div
              className="relative select-none"
              role="listbox"
              aria-label="Treatments"
              aria-activedescendant={`treatment-${service.slug}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  move(1);
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  move(-1);
                }
              }}
            >
              {/* The band the selected treatment sits in. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-2xl border border-copper/35 bg-copper-wash/70"
                style={{ height: ITEM_H }}
              />

              <div
                className="relative h-[330px] sm:h-[390px]"
                style={{ perspective: "900px" }}
              >
                <div className="absolute inset-x-0 top-1/2">
                  {SERVICES.map((item, i) => {
                    const half = SERVICES.length / 2;
                    let offset = i - active;
                    if (offset > half) offset -= SERVICES.length;
                    if (offset < -half) offset += SERVICES.length;
                    const distance = Math.abs(offset);
                    const hidden = distance > VISIBLE;
                    const isActive = offset === 0;

                    return (
                      <motion.button
                        key={item.slug}
                        id={`treatment-${item.slug}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => setActive(i)}
                        animate={{
                          y: offset * ITEM_H,
                          rotateX: offset * -26,
                          opacity: hidden ? 0 : 1 - distance * 0.26,
                          scale: 1 - distance * 0.07,
                        }}
                        transition={{ type: "spring", stiffness: 240, damping: 28 }}
                        className="absolute inset-x-0 flex items-center gap-4 px-4 text-left sm:gap-5 sm:px-6"
                        style={{
                          height: ITEM_H,
                          top: -ITEM_H / 2,
                          transformStyle: "preserve-3d",
                          transformOrigin: "center center",
                          pointerEvents: hidden ? "none" : "auto",
                          zIndex: 20 - distance,
                        }}
                      >
                        <span
                          className={`font-mono text-[0.66rem] tracking-[0.1em] transition-colors duration-300 ${
                            isActive ? "text-copper" : "text-faint"
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`flex-1 truncate font-display leading-tight transition-colors duration-300 ${
                            isActive
                              ? "text-[1.5rem] text-ink sm:text-[1.8rem]"
                              : "text-[1.25rem] text-soft sm:text-[1.45rem]"
                          }`}
                        >
                          {item.name}
                        </span>
                        {isActive && (
                          <span className="hidden font-mono text-[0.58rem] tracking-[0.12em] text-copper uppercase sm:block">
                            {item.group}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Wheel controls */}
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[0.62rem] tracking-[0.14em] text-faint">
                  {String(active + 1).padStart(2, "0")} / {String(SERVICES.length).padStart(2, "0")}
                </span>
                <div className="flex gap-2">
                  <WheelButton label="Previous treatment" onClick={() => move(-1)}>
                    ↑
                  </WheelButton>
                  <WheelButton label="Next treatment" onClick={() => move(1)}>
                    ↓
                  </WheelButton>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ---------------- Detail ---------------- */}
          <Reveal kind="blur" duration={1} className="min-w-0">
            <div className="card relative overflow-hidden p-8 sm:p-10 lg:sticky lg:top-28">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-8 -right-2 font-display text-[9rem] leading-none text-copper-wash select-none"
              >
                {String(active + 1).padStart(2, "0")}
              </span>

              <motion.div
                key={service.slug}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="relative"
              >
                <span className="label">{service.group}</span>
                <h3 className="mt-4 font-display text-[1.7rem] leading-tight text-ink sm:text-[2rem]">
                  {service.name}
                </h3>
                <p className="accent mt-3 text-[1.15rem] leading-snug sm:text-[1.3rem]">{service.line}</p>
                <p className="mt-4 leading-relaxed text-soft">{service.body}</p>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {service.includes.map((entry) => (
                    <li key={entry} className="chip">
                      {entry}
                    </li>
                  ))}
                </ul>

                <a href="#book" className="btn btn-ghost mt-7">
                  {service.cta}
                  <span className="arw" aria-hidden>
                    →
                  </span>
                </a>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function WheelButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-copper hover:text-copper"
    >
      {children}
    </button>
  );
}
