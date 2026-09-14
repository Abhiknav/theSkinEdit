import type { ReactNode } from "react";

/**
 * Infinite horizontal ribbon.
 *
 * The children are rendered twice inside one track; the CSS slides that track by
 * exactly half its width, so the seam never shows. Hovering pauses it, and
 * prefers-reduced-motion stops it (handled globally in globals.css).
 */
export function Ribbon({
  items,
  duration = 38,
  reverse = false,
  tone = "default",
  separator = true,
  itemClassName,
  className = "",
}: {
  items: ReactNode[];
  /** Seconds for one full pass. Longer = calmer. */
  duration?: number;
  reverse?: boolean;
  tone?: "default" | "deep";
  /** Dot between items — right for words, wrong for cards. */
  separator?: boolean;
  itemClassName?: string;
  className?: string;
}) {
  const defaultItem = `px-6 py-1 text-[0.95rem] whitespace-nowrap sm:px-8 sm:text-[1.05rem] ${
    tone === "deep" ? "text-cream/80" : "text-soft"
  }`;

  const pass = (key: string) => (
    <div className="flex shrink-0 items-center" aria-hidden={key === "b"} key={key}>
      {items.map((item, i) => (
        <span key={`${key}-${i}`} className="flex items-center">
          <span className={itemClassName ?? defaultItem}>{item}</span>
          {separator && (
            <span
              aria-hidden
              className={`h-1 w-1 shrink-0 rounded-full ${tone === "deep" ? "bg-copper" : "bg-copper/60"}`}
            />
          )}
        </span>
      ))}
    </div>
  );

  return (
    <div className={`ribbon-host ribbon-mask overflow-hidden ${className}`}>
      <div
        className={`ribbon ${reverse ? "ribbon-reverse" : ""}`}
        style={{ ["--ribbon-duration" as string]: `${duration}s` }}
      >
        {pass("a")}
        {pass("b")}
      </div>
    </div>
  );
}
