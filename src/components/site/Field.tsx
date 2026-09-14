"use client";

import { motion } from "framer-motion";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";

const labelBase =
  "pointer-events-none absolute left-0.5 top-[22px] text-soft transition-all duration-300 peer-focus:top-0 peer-focus:text-[0.6rem] peer-focus:tracking-[0.16em] peer-focus:uppercase peer-focus:text-copper peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[0.6rem] peer-[:not(:placeholder-shown)]:tracking-[0.16em] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:font-mono peer-focus:font-mono";

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div>
      <div className="relative">
        <input id={id} placeholder={label} {...props} className="field peer" />
        <label htmlFor={id} className={labelBase}>
          {label}
        </label>
      </div>
      {hint && <p className="mt-2 text-[0.78rem] text-faint">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div>
      <div className="relative">
        <textarea id={id} placeholder={label} rows={3} {...props} className="field peer resize-none" />
        <label htmlFor={id} className={labelBase}>
          {label}
        </label>
      </div>
      {hint && <p className="mt-2 text-[0.78rem] text-faint">{hint}</p>}
    </div>
  );
}

export function Notice({
  tone = "error",
  children,
}: {
  tone?: "error" | "info" | "success";
  children: ReactNode;
}) {
  const tones = {
    error: "border-copper-soft bg-copper-wash text-copper",
    info: "border-border bg-tint text-soft",
    success: "border-copper-soft bg-copper-wash text-copper",
  } as const;
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border px-5 py-3.5 text-[0.9rem] leading-relaxed ${tones[tone]}`}
      role={tone === "error" ? "alert" : undefined}
    >
      {children}
    </motion.p>
  );
}

export function SubmitButton({
  children,
  busy = false,
  disabled = false,
  className = "",
  tone = "primary",
}: {
  children: ReactNode;
  busy?: boolean;
  disabled?: boolean;
  className?: string;
  tone?: "primary" | "copper";
}) {
  return (
    <button
      type="submit"
      disabled={disabled || busy}
      className={`btn ${tone === "copper" ? "btn-copper" : "btn-primary"} ${className}`}
    >
      {busy && (
        <motion.span
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          className="block h-3.5 w-3.5 rounded-full border-[1.5px] border-current border-t-transparent"
        />
      )}
      {children}
      {!busy && (
        <span className="arw" aria-hidden>
          →
        </span>
      )}
    </button>
  );
}

export function ConsentCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3.5">
      <span
        className={`relative mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border transition-colors duration-300 ${
          checked ? "border-copper bg-copper" : "border-border bg-card"
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <motion.svg
          viewBox="0 0 14 14"
          className="h-3 w-3 text-white"
          initial={false}
          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.22 }}
          aria-hidden
        >
          <path d="M2 7.5L5.5 11L12 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </span>
      <span className="text-[0.82rem] leading-relaxed text-soft">{children}</span>
    </label>
  );
}
