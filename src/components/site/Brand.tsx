"use client";

import { motion } from "framer-motion";

/**
 * Wordmark. The letterhead's script "se" monogram, set in the display italic so
 * it sits in the same type system as the rest of the site.
 * Swap for the vector original when the brand files arrive.
 */
export function Brand({
  size = "md",
  stacked = false,
  compact = false,
  className = "",
}: {
  size?: "sm" | "md";
  stacked?: boolean;
  /**
   * Header use. The wordmark is the widest thing in the header row, and below
   * 380px it leaves no room for the booking button and the menu toggle side by
   * side — so the monogram carries the brand on its own down there, and the
   * name returns as soon as there is space for it.
   */
  compact?: boolean;
  className?: string;
}) {
  const mono = size === "sm" ? "text-[1.85rem]" : "text-[2.4rem]";
  const word = size === "sm" ? "text-[0.72rem]" : "text-[0.82rem]";
  const hideWord = compact ? "hidden min-[380px]:block" : "";

  return (
    <span className={`inline-flex items-center gap-2 sm:gap-3 ${className}`}>
      <span
        className={`font-display ${mono} leading-[0.7] text-copper italic`}
        style={{ fontWeight: 400 }}
        aria-hidden
      >
        se
      </span>
      <span className={`h-7 w-px bg-border ${hideWord || "block"}`} aria-hidden />
      <span
        className={`${hideWord} ${stacked ? "flex-col leading-tight" : "items-baseline gap-2"} ${
          hideWord ? "min-[380px]:flex" : "flex"
        }`}
      >
        <span
          className={`${word} font-medium tracking-[0.16em] whitespace-nowrap text-ink uppercase sm:tracking-[0.22em]`}
        >
          The Skin Edit
        </span>
        <span className="font-mono text-[0.54rem] tracking-[0.14em] whitespace-nowrap text-faint uppercase sm:text-[0.58rem] sm:tracking-[0.18em]">
          Dr Akshi Bansal
        </span>
      </span>
    </span>
  );
}

/** Hero treatment — the monogram writes itself in under an arc. */
export function BrandMark({ className = "" }: { className?: string }) {
  const ease = [0.16, 1, 0.3, 1] as const;
  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <motion.span
        className="font-display text-[3.4rem] leading-[0.8] text-copper italic"
        initial={{ opacity: 0, y: 16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease }}
        aria-hidden
      >
        se
      </motion.span>
      <motion.svg
        width="92"
        height="8"
        viewBox="0 0 92 8"
        fill="none"
        className="mt-1 text-copper/60"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <motion.path
          d="M1 6C14 6 20 1.5 34 1.5C48 1.5 56 5.5 70 5.5C79 5.5 86 4 91 2"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.35, ease }}
        />
      </motion.svg>
    </span>
  );
}
