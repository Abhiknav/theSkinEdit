"use client";

import { motion } from "framer-motion";

import type { ConsultMode } from "@/lib/types";

const OPTIONS: { value: ConsultMode; label: string; detail: string }[] = [
  { value: "clinic", label: "In person", detail: "First visits, examination, procedures" },
  { value: "online", label: "Online", detail: "Follow-ups, reports, second opinions" },
];

export function ModeToggle({ value, onChange }: { value: ConsultMode; onChange: (mode: ConsultMode) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
              active ? "border-deep" : "border-border bg-card hover:-translate-y-0.5 hover:border-copper"
            }`}
          >
            {active && (
              <motion.span
                layoutId="mode-fill"
                transition={{ type: "spring", stiffness: 340, damping: 34 }}
                className="absolute inset-0 bg-deep"
              />
            )}
            <span className="relative block">
              <span
                className={`font-display text-[1.3rem] transition-colors duration-200 ${
                  active ? "text-white" : "text-ink"
                }`}
              >
                {option.label}
              </span>
              <span
                className={`mt-1 block text-[0.82rem] leading-snug transition-colors duration-200 ${
                  active ? "text-white/60" : "text-faint"
                }`}
              >
                {option.detail}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
