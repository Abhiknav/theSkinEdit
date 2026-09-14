"use client";

import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";

import { BookingFlow } from "@/components/booking/BookingFlow";
import { ManageBooking } from "@/components/booking/ManageBooking";
import { Reveal, SectionHead } from "@/components/motion";
import { BOOKING } from "@/lib/content";

const EASE = [0.16, 1, 0.3, 1] as const;

type Tab = "book" | "manage";

export function Booking() {
  const [tab, setTab] = useState<Tab>("book");

  // A #manage link (or an email link carrying ?ref=) opens the right panel.
  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#manage") setTab("manage");
      else if (new URLSearchParams(window.location.search).get("ref")) setTab("manage");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <section id="book" className="band band-tint overflow-x-clip">
      <div className="wrap">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead label={BOOKING.label} title={BOOKING.title} accent={BOOKING.accent} lede={BOOKING.sub} />

          <Reveal kind="up" delay={0.15}>
            <div
              id="manage"
              className="inline-flex scroll-mt-32 rounded-full border border-border bg-card p-1.5"
              role="tablist"
            >
              {(
                [
                  { id: "book", label: "New appointment" },
                  { id: "manage", label: "Manage booking" },
                ] as const
              ).map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(item.id)}
                    className={`relative rounded-full px-5 py-2.5 text-[0.85rem] transition-colors duration-300 ${
                      active ? "text-white" : "text-soft hover:text-ink"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="booking-tab"
                        transition={{ type: "spring", stiffness: 360, damping: 34 }}
                        className="absolute inset-0 rounded-full bg-deep"
                      />
                    )}
                    <span className="relative whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        <Reveal kind="up" delay={0.1} duration={1} className="mt-12">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {tab === "book" ? (
                <BookingFlow />
              ) : (
                <Suspense fallback={<div className="mx-auto h-80 max-w-xl animate-pulse rounded-3xl bg-card" />}>
                  <ManageBooking />
                </Suspense>
              )}
            </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
