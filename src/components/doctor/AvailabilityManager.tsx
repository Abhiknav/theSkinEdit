"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Notice, SubmitButton } from "@/components/site/Field";
import { formatDay, formatTime } from "@/lib/types";

export interface Rule {
  id?: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  modes: ("clinic" | "online")[];
  active: boolean;
}

export interface Block {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function blankRule(weekday: number): Rule {
  return {
    weekday,
    start_time: "13:30",
    end_time: "17:30",
    slot_minutes: 20,
    modes: ["clinic", "online"],
    active: false,
  };
}

/** One row per weekday — the whole week visible at once, no modal, no wizard. */
export function AvailabilityManager({ initialRules, initialBlocks }: { initialRules: Rule[]; initialBlocks: Block[] }) {
  const [rules, setRules] = useState<Rule[]>(() =>
    WEEKDAYS.map((_, weekday) => initialRules.find((rule) => rule.weekday === weekday) ?? blankRule(weekday)),
  );
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

  function update(weekday: number, patch: Partial<Rule>) {
    setRules((current) => current.map((rule) => (rule.weekday === weekday ? { ...rule, ...patch } : rule)));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const payload = rules
        .filter((rule) => rule.active)
        .map(({ weekday, start_time, end_time, slot_minutes, modes, active }) => ({
          weekday,
          start_time,
          end_time,
          slot_minutes,
          modes,
          active,
        }));
      const response = await fetch("/api/doctor/availability", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rules: payload }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save.");
      setMessage({ tone: "success", text: "Saved. The public calendar has already been rebuilt." });
    } catch (cause) {
      setMessage({ tone: "error", text: cause instanceof Error ? cause.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-16">
      <section>
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <h2 className="font-display text-3xl text-ink">Weekly hours</h2>
            <p className="mt-2 max-w-xl text-sm text-soft">
              Switch a day on, set the window, and the calendar fills itself. Booked appointments are never touched.
            </p>
          </div>
        </header>

        <form onSubmit={save} className="mt-8 space-y-3">
          {rules.map((rule) => (
            <motion.div
              layout
              key={rule.weekday}
              className={`grid items-center gap-4 border p-5 transition-colors duration-300 lg:grid-cols-[11rem_auto_auto_auto] ${
                rule.active ? "border-copper/35 bg-card" : "border-border bg-tint/60"
              }`}
            >
              <button
                type="button"
                onClick={() => update(rule.weekday, { active: !rule.active })}
                className="flex items-center gap-3 text-left"
              >
                <span
                  className={`relative flex h-6 w-11 items-center rounded-full border transition-colors duration-300 ${
                    rule.active ? "border-copper bg-copper" : "border-border bg-card"
                  }`}
                >
                  <motion.span
                    animate={{ x: rule.active ? 20 : 2 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    className={`block h-4 w-4 rounded-full ${rule.active ? "bg-card" : "bg-faint/40"}`}
                  />
                </span>
                <span className={`text-sm ${rule.active ? "text-ink" : "text-faint"}`}>
                  {WEEKDAYS[rule.weekday]}
                </span>
              </button>

              <div className="flex items-center gap-3">
                <TimeInput
                  value={rule.start_time}
                  disabled={!rule.active}
                  onChange={(value) => update(rule.weekday, { start_time: value })}
                />
                <span className="text-faint">—</span>
                <TimeInput
                  value={rule.end_time}
                  disabled={!rule.active}
                  onChange={(value) => update(rule.weekday, { end_time: value })}
                />
              </div>

              <label className="flex items-center gap-3 text-xs text-faint">
                <span className="tracking-[0.14em] uppercase">Slot</span>
                <select
                  value={rule.slot_minutes}
                  disabled={!rule.active}
                  onChange={(event) => update(rule.weekday, { slot_minutes: Number(event.target.value) })}
                  className="border border-border bg-card px-3 py-2 text-sm text-ink disabled:opacity-40"
                >
                  {[10, 15, 20, 30, 45, 60].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} min
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-2">
                {(["clinic", "online"] as const).map((mode) => {
                  const on = rule.modes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={!rule.active}
                      onClick={() =>
                        update(rule.weekday, {
                          modes: on
                            ? (rule.modes.filter((m) => m !== mode) as Rule["modes"])
                            : ([...rule.modes, mode] as Rule["modes"]),
                        })
                      }
                      className={`border px-4 py-2 text-[0.6rem] tracking-[0.16em] uppercase transition-colors duration-300 disabled:opacity-35 ${
                        on ? "border-deep bg-deep text-white" : "border-border text-faint"
                      }`}
                    >
                      {mode === "clinic" ? "In clinic" : "Online"}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}

          <div className="flex flex-wrap items-center gap-6 pt-4">
            <SubmitButton busy={busy}>Save hours</SubmitButton>
            <AnimatePresence>
              {message && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs ${message.tone === "error" ? "text-copper" : "text-soft"}`}
                >
                  {message.text}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </form>
      </section>

      <BlockManager blocks={blocks} onChange={setBlocks} />
    </div>
  );
}

function TimeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="time"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="border border-border bg-card px-3 py-2 text-sm text-ink transition-colors focus:border-copper focus:outline-none disabled:opacity-40"
    />
  );
}

function BlockManager({ blocks, onChange }: { blocks: Block[]; onChange: (blocks: Block[]) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [start, setStart] = useState("13:30");
  const [end, setEnd] = useState("17:30");
  const [reason, setReason] = useState("");
  const [wholeDay, setWholeDay] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<number>(0);

  async function addBlock(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setConflicts(0);
    try {
      // Times are entered in the doctor's own timezone (IST), which is also the clinic's.
      const startAt = new Date(`${date}T${wholeDay ? "00:00" : start}`).toISOString();
      const endAt = new Date(`${date}T${wholeDay ? "23:59" : end}`).toISOString();
      const response = await fetch("/api/doctor/availability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ startAt, endAt, reason: reason || null }),
      });
      const payload = (await response.json()) as { block?: Block; conflicts?: string[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not block that time.");
      onChange([...blocks, payload.block!].sort((a, b) => a.start_at.localeCompare(b.start_at)));
      setConflicts(payload.conflicts?.length ?? 0);
      setReason("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not block that time.");
    } finally {
      setBusy(false);
    }
  }

  async function removeBlock(id: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/doctor/availability?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not remove that block.");
      onChange(blocks.filter((block) => block.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove that block.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <header className="border-b border-border pb-5">
        <h2 className="font-display text-3xl text-ink">Time off</h2>
        <p className="mt-2 max-w-xl text-sm text-soft">
          Block a date or a few hours — conference, leave, a theatre list. Blocked time disappears from the public
          calendar immediately.
        </p>
      </header>

      <form onSubmit={addBlock} className="mt-8 grid gap-5 border border-border bg-card p-6 lg:grid-cols-[auto_auto_1fr_auto] lg:items-end">
        <label className="block">
          <span className="text-[0.6rem] tracking-[0.18em] text-faint uppercase">Date</span>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(event) => setDate(event.target.value)}
            className="mt-2 block border border-border bg-tint px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none"
          />
        </label>

        <div>
          <span className="text-[0.6rem] tracking-[0.18em] text-faint uppercase">Window</span>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setWholeDay(!wholeDay)}
              className={`border px-4 py-2 text-[0.6rem] tracking-[0.16em] uppercase transition-colors ${
                wholeDay ? "border-deep bg-deep text-white" : "border-border text-faint"
              }`}
            >
              Whole day
            </button>
            {!wholeDay && (
              <div className="flex items-center gap-2">
                <TimeInput value={start} onChange={setStart} />
                <span className="text-faint">—</span>
                <TimeInput value={end} onChange={setEnd} />
              </div>
            )}
          </div>
        </div>

        <label className="block">
          <span className="text-[0.6rem] tracking-[0.18em] text-faint uppercase">Reason (optional)</span>
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Conference, leave, theatre list…"
            className="mt-2 block w-full border border-border bg-tint px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none"
          />
        </label>

        <SubmitButton busy={busy}>Block it</SubmitButton>
      </form>

      {error && (
        <div className="mt-5">
          <Notice>{error}</Notice>
        </div>
      )}
      {conflicts > 0 && (
        <div className="mt-5">
          <Notice tone="info">
            {conflicts} appointment{conflicts === 1 ? " is" : "s are"} already booked inside that window and{" "}
            {conflicts === 1 ? "was" : "were"} left untouched. Cancel {conflicts === 1 ? "it" : "them"} from the
            Appointments tab if you need the time back.
          </Notice>
        </div>
      )}

      <div className="mt-8 divide-y divide-line border-t border-border">
        {blocks.length === 0 && <p className="py-6 text-sm text-faint">No time blocked in the next eight weeks.</p>}
        <AnimatePresence initial={false}>
          {blocks.map((block) => (
            <motion.div
              key={block.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap items-center justify-between gap-4 py-4"
            >
              <div>
                <div className="text-ink">{formatDay(block.start_at)}</div>
                <div className="text-xs text-faint">
                  {formatTime(block.start_at)} — {formatTime(block.end_at)}
                  {block.reason ? ` · ${block.reason}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                disabled={busy}
                className="text-[0.6rem] tracking-[0.16em] text-faint uppercase transition-colors hover:text-copper disabled:opacity-40"
              >
                Remove
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
