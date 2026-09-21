"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Reveal, SectionHead } from "@/components/motion";
import { SERVICES } from "@/lib/content";

/** Must match `.wheel-item` height in globals.css. */
const ITEM_H = 62;
/** Items further than this from the centre are rotated out of sight. */
const VISIBLE = 3;

/**
 * Treatments as a vertical wheel.
 *
 * The list is a real scroll container, so a finger, a trackpad or the arrow
 * keys all move it and the detail panel follows whatever sits in the copper
 * band. The 3D curve is painted imperatively from the scroll offset inside a
 * rAF — driving it through React state instead would re-render the whole
 * section on every scroll frame.
 */
export function Treatments() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  const scroller = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const activeRef = useRef(0);
  const frame = useRef(0);

  const paint = useCallback(() => {
    const el = scroller.current;
    if (!el) return;

    const pos = el.scrollTop / ITEM_H;
    for (let i = 0; i < items.current.length; i += 1) {
      const node = items.current[i];
      if (!node) continue;
      const offset = i - pos;
      const distance = Math.abs(offset);
      const hidden = distance > VISIBLE;

      node.style.opacity = hidden ? "0" : String(Math.max(0, 1 - distance * 0.26));
      node.style.transform = reduced
        ? "none"
        : `rotateX(${offset * -26}deg) scale(${Math.max(0.6, 1 - distance * 0.07)})`;
      node.style.pointerEvents = hidden ? "none" : "auto";
      node.style.zIndex = String(20 - Math.round(distance));
    }

    const next = Math.min(SERVICES.length - 1, Math.max(0, Math.round(pos)));
    if (next !== activeRef.current) {
      activeRef.current = next;
      setActive(next);
    }
  }, [reduced]);

  const onScroll = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      paint();
    });
  }, [paint]);

  // Paint once on mount so the curve is correct before the first scroll.
  useEffect(() => {
    paint();
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [paint]);

  const goTo = useCallback(
    (index: number) => {
      const el = scroller.current;
      if (!el) return;
      const clamped = Math.min(SERVICES.length - 1, Math.max(0, index));
      el.scrollTo({ top: clamped * ITEM_H, behavior: reduced ? "auto" : "smooth" });
    },
    [reduced],
  );

  const service = SERVICES[active];

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
            <div className="select-none">
              {/* The band must be centred on the scroller alone. Centring it on a
                  wrapper that also holds the controls below pushed it half their
                  height down, so the selected row sat against its top edge. */}
              <div className="relative">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 rounded-2xl border border-copper/35 bg-copper-wash/70"
                  style={{ height: ITEM_H }}
                />

                <div
                  ref={scroller}
                  onScroll={onScroll}
                  className="wheel relative"
                  role="listbox"
                  aria-label="Treatments"
                  aria-activedescendant={`treatment-${service.slug}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                      e.preventDefault();
                      goTo(active + 1);
                    }
                    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      goTo(active - 1);
                    }
                    if (e.key === "Home") {
                      e.preventDefault();
                      goTo(0);
                    }
                    if (e.key === "End") {
                      e.preventDefault();
                      goTo(SERVICES.length - 1);
                    }
                  }}
                >
                  {SERVICES.map((item, i) => {
                    const isActive = i === active;
                    return (
                      <button
                        key={item.slug}
                        id={`treatment-${item.slug}`}
                        ref={(node) => {
                          items.current[i] = node;
                        }}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        tabIndex={-1}
                        onClick={() => goTo(i)}
                        className="wheel-item flex w-full items-center gap-4 px-4 text-left sm:gap-5 sm:px-6"
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
                      </button>
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
                  <WheelButton
                    label="Previous treatment"
                    onClick={() => goTo(active - 1)}
                    disabled={active === 0}
                  >
                    ↑
                  </WheelButton>
                  <WheelButton
                    label="Next treatment"
                    onClick={() => goTo(active + 1)}
                    disabled={active === SERVICES.length - 1}
                  >
                    ↓
                  </WheelButton>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ---------------- Detail ---------------- */}
          <Reveal kind="blur" duration={1} className="min-w-0">
            <Detail service={service} reduced={Boolean(reduced)} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/**
 * `useLayoutEffect` on the client, `useEffect` on the server, where layout
 * effects do not run and React warns about them.
 */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Types the description out a few characters per frame, in roughly the same
 * time whatever its length. The full text is always in the DOM for assistive
 * tech, and an invisible copy holds the final height so the tags below do not
 * get pushed down as the words arrive.
 */
function useTypewriter(text: string, enabled: boolean, ms = 850) {
  // Starts as the full string so the server-rendered markup carries the real
  // copy. Blanking it in a *layout* effect means that value is never painted —
  // with a plain effect the panel would flash the finished text, and on every
  // change it would flash the previous treatment's, for one frame first.
  const [typed, setTyped] = useState(text);

  useIsoLayoutEffect(() => {
    if (!enabled) {
      setTyped(text);
      return;
    }
    const step = Math.max(1, Math.ceil(text.length / (ms / 16)));
    let shown = 0;
    let last = 0;
    let raf = 0;

    const tick = (now: number) => {
      if (now - last >= 16) {
        last = now;
        shown = Math.min(text.length, shown + step);
        setTyped(text.slice(0, shown));
      }
      if (shown < text.length) raf = requestAnimationFrame(tick);
    };

    setTyped("");
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, enabled, ms]);

  return typed;
}

function Detail({ service, reduced }: { service: (typeof SERVICES)[number]; reduced: boolean }) {
  const typed = useTypewriter(service.body, !reduced);
  const typing = typed.length < service.body.length;

  return (
    <div className="card relative overflow-hidden p-8 sm:p-10 lg:sticky lg:top-28">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-2 font-display text-[9rem] leading-none text-copper-wash select-none"
      >
        {String(SERVICES.indexOf(service) + 1).padStart(2, "0")}
      </span>

      {/* Keyed on the slug so every reveal below replays when the wheel moves. */}
      <div key={service.slug} className="relative">
        <span className="label detail-in" style={{ "--i": 0 } as React.CSSProperties}>
          {service.group}
        </span>
        <h3
          className="detail-in mt-4 font-display text-[1.7rem] leading-tight text-ink sm:text-[2rem]"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          {service.name}
        </h3>
        <p
          className="accent detail-in mt-3 text-[1.15rem] leading-snug sm:text-[1.3rem]"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          {service.line}
        </p>

        <p className="relative mt-4 leading-relaxed text-soft">
          <span className="invisible" aria-hidden>
            {service.body}
          </span>
          <span className="absolute inset-0" aria-hidden>
            {typed}
            {typing && <span className="caret" />}
          </span>
          <span className="sr-only">{service.body}</span>
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {service.includes.map((entry, i) => (
            <li
              key={entry}
              className="chip chip-rise"
              style={{ "--i": i } as React.CSSProperties}
            >
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
      </div>
    </div>
  );
}

function WheelButton({
  children,
  onClick,
  label,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-copper hover:text-copper disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}
