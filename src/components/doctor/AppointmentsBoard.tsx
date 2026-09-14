"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import { Notice } from "@/components/site/Field";
import { formatDay, formatTime } from "@/lib/types";

export interface DashboardAppointment {
  id: string;
  reference: string;
  startAt: string;
  endAt: string;
  mode: "clinic" | "online";
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string | null;
}

const STATUS_LABEL: Record<DashboardAppointment["status"], string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  no_show: "No show",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<DashboardAppointment["status"], string> = {
  confirmed: "border-copper/40 bg-copper-wash text-copper",
  completed: "border-deep/20 bg-deep/5 text-ink",
  no_show: "border-border bg-tint text-faint",
  cancelled: "border-border bg-tint text-faint line-through",
};

export function AppointmentsBoard({ initial }: { initial: DashboardAppointment[] }) {
  const [appointments, setAppointments] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const now = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return {
      today: appointments.filter(
        (a) => new Date(a.startAt).getTime() <= endOfToday.getTime() && new Date(a.endAt).getTime() >= now,
      ),
      upcoming: appointments.filter((a) => new Date(a.startAt).getTime() > endOfToday.getTime()),
      past: appointments
        .filter((a) => new Date(a.endAt).getTime() < now)
        .sort((a, b) => b.startAt.localeCompare(a.startAt)),
    };
  }, [appointments]);

  async function setStatus(appointmentId: string, status: DashboardAppointment["status"]) {
    setBusyId(appointmentId);
    setError(null);
    try {
      const response = await fetch("/api/doctor/appointments", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appointmentId, status }),
      });
      const payload = (await response.json()) as { appointments?: DashboardAppointment[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not update that.");
      setAppointments(payload.appointments ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update that.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-14">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Today" value={groups.today.length} accent />
        <Metric label="Upcoming" value={groups.upcoming.length} />
        <Metric label="Seen (recent)" value={groups.past.filter((a) => a.status === "completed").length} />
      </div>

      {error && <Notice>{error}</Notice>}

      <Group title="Today" empty="Nothing left in today's diary." items={groups.today} busyId={busyId} onStatus={setStatus} />
      <Group title="Upcoming" empty="No future appointments yet." items={groups.upcoming} busyId={busyId} onStatus={setStatus} />
      <Group title="Recently past" empty="Nothing in the last week." items={groups.past} busyId={busyId} onStatus={setStatus} />
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`border p-6 ${accent ? "border-copper/40 bg-copper-wash" : "border-border bg-card"}`}>
      <div className={`font-display text-4xl ${accent ? "text-copper" : "text-ink"}`}>{value}</div>
      <div className="mt-1 text-[0.6rem] tracking-[0.2em] text-faint uppercase">{label}</div>
    </div>
  );
}

function Group({
  title,
  items,
  empty,
  busyId,
  onStatus,
}: {
  title: string;
  items: DashboardAppointment[];
  empty: string;
  busyId: string | null;
  onStatus: (id: string, status: DashboardAppointment["status"]) => void;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-border pb-4">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        <span className="text-[0.6rem] tracking-[0.2em] text-faint uppercase">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-sm text-faint">{empty}</p>
      ) : (
        <div className="divide-y divide-line">
          <AnimatePresence initial={false}>
            {items.map((appointment) => (
              <motion.article
                key={appointment.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid gap-5 py-6 lg:grid-cols-[8rem_1fr_auto] lg:items-center"
              >
                <div>
                  <div className="font-display text-xl text-ink">{formatTime(appointment.startAt)}</div>
                  <div className="text-[0.6rem] tracking-[0.14em] text-faint uppercase">
                    {formatDay(appointment.startAt)}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg text-ink">{appointment.patientName}</span>
                    <span
                      className={`border px-2.5 py-0.5 text-[0.55rem] tracking-[0.16em] uppercase ${STATUS_TONE[appointment.status]}`}
                    >
                      {STATUS_LABEL[appointment.status]}
                    </span>
                    <span className="text-[0.55rem] tracking-[0.16em] text-faint uppercase">
                      {appointment.mode === "online" ? "Online" : "In clinic"} · {appointment.reference}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-faint">
                    <a href={`tel:${appointment.patientPhone}`} className="hover:text-copper">
                      {appointment.patientPhone}
                    </a>
                    <a href={`mailto:${appointment.patientEmail}`} className="hover:text-copper">
                      {appointment.patientEmail}
                    </a>
                  </div>
                  {appointment.reason && (
                    <p className="mt-2 max-w-xl text-sm text-soft">{appointment.reason}</p>
                  )}
                </div>

                {appointment.status === "confirmed" && (
                  <div className="flex flex-wrap gap-2">
                    <Action busy={busyId === appointment.id} onClick={() => onStatus(appointment.id, "completed")}>
                      Completed
                    </Action>
                    <Action busy={busyId === appointment.id} onClick={() => onStatus(appointment.id, "no_show")}>
                      No show
                    </Action>
                    <Action
                      busy={busyId === appointment.id}
                      tone="quiet"
                      onClick={() => onStatus(appointment.id, "cancelled")}
                    >
                      Cancel
                    </Action>
                  </div>
                )}
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
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
