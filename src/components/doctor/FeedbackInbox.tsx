"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Notice } from "@/components/site/Field";

export interface FeedbackRow {
  id: string;
  patient_name: string;
  rating: number;
  comment: string;
  status: "pending" | "published" | "hidden";
  created_at: string;
}

const TABS: { id: FeedbackRow["status"] | "all"; label: string }[] = [
  { id: "pending", label: "To review" },
  { id: "published", label: "On the site" },
  { id: "hidden", label: "Hidden" },
  { id: "all", label: "Everything" },
];

export function FeedbackInbox({ initial }: { initial: FeedbackRow[] }) {
  const [rows, setRows] = useState(initial);
  const [tab, setTab] = useState<FeedbackRow["status"] | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = tab === "all" ? rows : rows.filter((row) => row.status === tab);

  async function setStatus(feedbackId: string, status: FeedbackRow["status"]) {
    setBusyId(feedbackId);
    setError(null);
    try {
      const response = await fetch("/api/doctor/feedback", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ feedbackId, status }),
      });
      const payload = (await response.json()) as { feedback?: FeedbackRow[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not update that.");
      setRows(payload.feedback ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update that.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => {
          const count = item.id === "all" ? rows.length : rows.filter((row) => row.status === item.id).length;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`border px-5 py-2.5 text-[0.62rem] tracking-[0.16em] uppercase transition-colors duration-300 ${
                active ? "border-deep bg-deep text-white" : "border-border text-faint hover:border-copper hover:text-copper"
              }`}
            >
              {item.label} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {error && <Notice>{error}</Notice>}

      {visible.length === 0 ? (
        <p className="border border-border bg-card p-10 text-center text-sm text-faint">
          Nothing here yet. Feedback requests go out automatically a couple of hours after each appointment.
        </p>
      ) : (
        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          <AnimatePresence initial={false}>
            {visible.map((row) => (
              <motion.article
                key={row.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col justify-between gap-6 bg-card p-7"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-1 text-copper" aria-label={`${row.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span key={index} className={index < row.rating ? "opacity-100" : "opacity-25"}>
                          ✦
                        </span>
                      ))}
                    </div>
                    <span className="text-[0.55rem] tracking-[0.16em] text-faint uppercase">{row.status}</span>
                  </div>
                  <blockquote className="mt-5 font-display text-xl leading-snug text-ink">“{row.comment}”</blockquote>
                  <p className="mt-4 text-[0.6rem] tracking-[0.18em] text-faint uppercase">
                    {row.patient_name} ·{" "}
                    {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
                      new Date(row.created_at),
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {row.status !== "published" && (
                    <Action busy={busyId === row.id} onClick={() => setStatus(row.id, "published")}>
                      Publish
                    </Action>
                  )}
                  {row.status !== "hidden" && (
                    <Action busy={busyId === row.id} tone="quiet" onClick={() => setStatus(row.id, "hidden")}>
                      Hide
                    </Action>
                  )}
                  {row.status !== "pending" && (
                    <Action busy={busyId === row.id} tone="quiet" onClick={() => setStatus(row.id, "pending")}>
                      Back to review
                    </Action>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function Action({
  children,
  onClick,
  busy,
  tone = "solid",
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  tone?: "solid" | "quiet";
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`border px-4 py-2 text-[0.6rem] tracking-[0.16em] uppercase transition-colors duration-300 disabled:opacity-40 ${
        tone === "solid"
          ? "border-deep text-ink hover:bg-deep hover:text-white"
          : "border-border text-faint hover:border-copper hover:text-copper"
      }`}
    >
      {children}
    </button>
  );
}
