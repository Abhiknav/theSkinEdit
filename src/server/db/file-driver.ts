/**
 * Zero-setup storage driver: a JSON document on disk, serialised through a
 * process-level mutex so booking stays atomic without a database.
 *
 * This is the prototype path. Set DATABASE_URL and the Postgres driver takes
 * over with real transactions and row-level locks — same Store contract.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { BookingError } from "./errors";
import { DEFAULT_DOCTOR, DEFAULT_RULES, newReference } from "./seed";
import type {
  AppointmentDetail,
  AppointmentStatus,
  AvailabilityBlock,
  AvailabilityRule,
  BookSlotInput,
  Doctor,
  Feedback,
  FeedbackStatus,
  ID,
  ISODate,
  NotificationJob,
  NotificationKind,
  NotificationStatus,
  Patient,
  Slot,
  Store,
  Appointment,
} from "./types";

interface DbShape {
  doctors: Doctor[];
  patients: Patient[];
  availability_rules: AvailabilityRule[];
  availability_blocks: AvailabilityBlock[];
  slots: Slot[];
  appointments: Appointment[];
  feedback: Feedback[];
  notifications: NotificationJob[];
}

/**
 * Serverless filesystems are read-only apart from the temp directory, and that
 * directory is per-instance and wiped between cold starts. The store still
 * works there, but only well enough to demo — production needs DATABASE_URL.
 */
const ON_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR =
  process.env.DATA_DIR ||
  (ON_SERVERLESS ? path.join(os.tmpdir(), "theskinedit") : path.join(process.cwd(), ".data"));
const DATA_FILE = path.join(DATA_DIR, "theskinedit.json");

function emptyDb(): DbShape {
  return {
    doctors: [],
    patients: [],
    availability_rules: [],
    availability_blocks: [],
    slots: [],
    appointments: [],
    feedback: [],
    notifications: [],
  };
}

export class FileStore implements Store {
  readonly kind = "file" as const;

  private db: DbShape = emptyDb();
  private loaded = false;
  /** Serialises every mutation — the file driver equivalent of row-level locking. */
  private chain: Promise<unknown> = Promise.resolve();

  private async load() {
    if (this.loaded) return;
    await mkdir(DATA_DIR, { recursive: true });
    try {
      const raw = await readFile(DATA_FILE, "utf8");
      this.db = { ...emptyDb(), ...(JSON.parse(raw) as DbShape) };
    } catch {
      this.db = emptyDb();
    }
    this.loaded = true;
  }

  private async persist() {
    const tmp = `${DATA_FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(this.db, null, 2), "utf8");
    await rename(tmp, DATA_FILE);
  }

  /** Run fn with exclusive access to the document, persisting any changes. */
  private transaction<T>(fn: () => T | Promise<T>): Promise<T> {
    const run = this.chain.then(async () => {
      await this.load();
      const result = await fn();
      await this.persist();
      return result;
    });
    this.chain = run.catch(() => undefined);
    return run;
  }

  private read<T>(fn: () => T | Promise<T>): Promise<T> {
    const run = this.chain.then(async () => {
      await this.load();
      return fn();
    });
    this.chain = run.catch(() => undefined);
    return run;
  }

  async init() {
    await this.transaction(() => {
      if (this.db.doctors.length === 0) {
        this.db.doctors.push({ ...DEFAULT_DOCTOR });
      }
      if (this.db.availability_rules.length === 0) {
        for (const rule of DEFAULT_RULES) {
          this.db.availability_rules.push({ ...rule, id: randomUUID() });
        }
      }
    });
  }

  async getDoctor(slug: string) {
    return this.read(() => this.db.doctors.find((d) => d.slug === slug) ?? null);
  }

  async listDoctors() {
    return this.read(() => [...this.db.doctors]);
  }

  async listAvailabilityRules(doctorId: ID) {
    return this.read(() =>
      this.db.availability_rules
        .filter((r) => r.doctor_id === doctorId)
        .sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)),
    );
  }

  async replaceAvailabilityRules(doctorId: ID, rules: Omit<AvailabilityRule, "id" | "doctor_id">[]) {
    return this.transaction(() => {
      this.db.availability_rules = this.db.availability_rules.filter((r) => r.doctor_id !== doctorId);
      const created = rules.map((r) => ({ ...r, id: randomUUID(), doctor_id: doctorId }));
      this.db.availability_rules.push(...created);
      return created;
    });
  }

  async listBlocks(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    return this.read(() =>
      this.db.availability_blocks
        .filter((b) => b.doctor_id === doctorId && b.end_at > fromISO && b.start_at < toISO)
        .sort((a, b) => a.start_at.localeCompare(b.start_at)),
    );
  }

  async createBlock(doctorId: ID, startISO: ISODate, endISO: ISODate, reason: string | null) {
    return this.transaction(() => {
      const block: AvailabilityBlock = {
        id: randomUUID(),
        doctor_id: doctorId,
        start_at: startISO,
        end_at: endISO,
        reason,
        created_at: new Date().toISOString(),
      };
      this.db.availability_blocks.push(block);
      return block;
    });
  }

  async deleteBlock(doctorId: ID, blockId: ID) {
    await this.transaction(() => {
      this.db.availability_blocks = this.db.availability_blocks.filter(
        (b) => !(b.id === blockId && b.doctor_id === doctorId),
      );
    });
  }

  async listSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    return this.read(() =>
      this.db.slots
        .filter((s) => s.doctor_id === doctorId && s.start_at >= fromISO && s.start_at < toISO)
        .sort((a, b) => a.start_at.localeCompare(b.start_at)),
    );
  }

  async insertSlotsIgnoringConflicts(slots: Slot[]) {
    return this.transaction(() => {
      const seen = new Set(this.db.slots.map((s) => `${s.doctor_id}|${s.start_at}`));
      let inserted = 0;
      for (const slot of slots) {
        const key = `${slot.doctor_id}|${slot.start_at}`;
        if (seen.has(key)) continue;
        seen.add(key);
        this.db.slots.push(slot);
        inserted += 1;
      }
      return inserted;
    });
  }

  async blockOpenSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    return this.transaction(() => {
      const conflicts: ID[] = [];
      let blocked = 0;
      for (const slot of this.db.slots) {
        if (slot.doctor_id !== doctorId) continue;
        if (!(slot.start_at < toISO && slot.end_at > fromISO)) continue;
        if (slot.status === "booked") {
          conflicts.push(slot.id);
          continue;
        }
        if (slot.status === "open") {
          slot.status = "blocked";
          blocked += 1;
        }
      }
      return { blocked, conflicts };
    });
  }

  async unblockSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    return this.transaction(() => {
      let count = 0;
      for (const slot of this.db.slots) {
        if (slot.doctor_id !== doctorId) continue;
        if (!(slot.start_at < toISO && slot.end_at > fromISO)) continue;
        if (slot.status === "blocked") {
          slot.status = "open";
          count += 1;
        }
      }
      return count;
    });
  }

  async deleteOpenSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    return this.transaction(() => {
      // A slot referenced by any appointment (including a cancelled one) must
      // survive, or the appointment row is orphaned. Postgres enforces the same
      // thing with a foreign key.
      const referenced = new Set(this.db.appointments.map((a) => a.slot_id));
      const before = this.db.slots.length;
      this.db.slots = this.db.slots.filter(
        (s) =>
          !(
            s.doctor_id === doctorId &&
            s.start_at >= fromISO &&
            s.start_at < toISO &&
            s.status !== "booked" &&
            !referenced.has(s.id)
          ),
      );
      return before - this.db.slots.length;
    });
  }

  /**
   * Finds the person, or records a new one.
   *
   * Matched on phone *and* name, because a phone number identifies a household
   * rather than a person: a mother and her son booking from the same number are
   * two patients. Only the matched person's contact details are refreshed.
   */
  private upsertPatientSync(doctorId: ID, input: BookSlotInput["patient"]): Patient {
    const now = new Date().toISOString();
    const phone = input.phone.trim();
    const fullName = input.fullName.trim();
    const existing = this.db.patients.find(
      (p) => p.phone === phone && p.full_name.toLowerCase() === fullName.toLowerCase(),
    );
    if (existing) {
      existing.email = input.email.trim().toLowerCase();
      existing.updated_at = now;
      existing.consent_at = now;
      return existing;
    }
    const patient: Patient = {
      id: randomUUID(),
      doctor_id: doctorId,
      full_name: fullName,
      phone,
      email: input.email.trim().toLowerCase(),
      auth_user_id: null,
      consent_at: now,
      created_at: now,
      updated_at: now,
    };
    this.db.patients.push(patient);
    return patient;
  }

  private detail(appointment: Appointment): AppointmentDetail {
    const slot = this.db.slots.find((s) => s.id === appointment.slot_id);
    const patient = this.db.patients.find((p) => p.id === appointment.patient_id);
    if (!slot || !patient) {
      throw new BookingError("NOT_FOUND", "This appointment is missing its slot or patient record.");
    }
    return { ...appointment, slot, patient };
  }

  async bookSlot(input: BookSlotInput) {
    return this.transaction(() => {
      const slot = this.db.slots.find((s) => s.id === input.slotId && s.doctor_id === input.doctorId);
      if (!slot) throw new BookingError("SLOT_NOT_FOUND", "That slot no longer exists.");
      if (slot.status !== "open") throw new BookingError("SLOT_TAKEN", "That slot has just been taken.");
      if (new Date(slot.start_at).getTime() < Date.now()) {
        throw new BookingError("SLOT_PAST", "That slot is in the past.");
      }
      if (!slot.modes.includes(input.mode)) {
        throw new BookingError("MODE_UNAVAILABLE", "That consultation type is not offered in this slot.");
      }

      const patient = this.upsertPatientSync(input.doctorId, input.patient);
      const now = new Date().toISOString();
      slot.status = "booked";

      const appointment: Appointment = {
        id: randomUUID(),
        reference: this.uniqueReferenceSync(),
        doctor_id: input.doctorId,
        slot_id: slot.id,
        patient_id: patient.id,
        patient_name: patient.full_name,
        patient_phone: patient.phone,
        patient_email: patient.email,
        mode: input.mode,
        status: "confirmed",
        reason: input.reason?.trim() || null,
        consent_at: now,
        created_at: now,
        updated_at: now,
      };
      this.db.appointments.push(appointment);
      return this.detail(appointment);
    });
  }

  private uniqueReferenceSync(): string {
    for (let i = 0; i < 20; i += 1) {
      const ref = newReference();
      if (!this.db.appointments.some((a) => a.reference === ref)) return ref;
    }
    throw new BookingError("REFERENCE_COLLISION", "Could not allocate a booking reference.");
  }

  async rescheduleAppointment(appointmentId: ID, newSlotId: ID, mode?: BookSlotInput["mode"]) {
    return this.transaction(() => {
      const appointment = this.db.appointments.find((a) => a.id === appointmentId);
      if (!appointment) throw new BookingError("NOT_FOUND", "Appointment not found.");
      if (appointment.status !== "confirmed") {
        throw new BookingError("NOT_ACTIVE", "Only a confirmed appointment can be moved.");
      }
      const target = this.db.slots.find((s) => s.id === newSlotId && s.doctor_id === appointment.doctor_id);
      if (!target) throw new BookingError("SLOT_NOT_FOUND", "That slot no longer exists.");
      if (target.status !== "open") throw new BookingError("SLOT_TAKEN", "That slot has just been taken.");
      const nextMode = mode ?? appointment.mode;
      if (!target.modes.includes(nextMode)) {
        throw new BookingError("MODE_UNAVAILABLE", "That consultation type is not offered in this slot.");
      }

      const previous = this.db.slots.find((s) => s.id === appointment.slot_id);
      if (previous && previous.status === "booked") previous.status = "open";

      target.status = "booked";
      appointment.slot_id = target.id;
      appointment.mode = nextMode;
      appointment.updated_at = new Date().toISOString();
      return this.detail(appointment);
    });
  }

  async cancelAppointment(appointmentId: ID) {
    return this.transaction(() => {
      const appointment = this.db.appointments.find((a) => a.id === appointmentId);
      if (!appointment) throw new BookingError("NOT_FOUND", "Appointment not found.");
      if (appointment.status === "cancelled") return this.detail(appointment);
      const slot = this.db.slots.find((s) => s.id === appointment.slot_id);
      if (slot && slot.status === "booked") slot.status = "open";
      appointment.status = "cancelled";
      appointment.updated_at = new Date().toISOString();
      return this.detail(appointment);
    });
  }

  async updateAppointmentStatus(doctorId: ID, appointmentId: ID, status: AppointmentStatus) {
    return this.transaction(() => {
      const appointment = this.db.appointments.find((a) => a.id === appointmentId && a.doctor_id === doctorId);
      if (!appointment) throw new BookingError("NOT_FOUND", "Appointment not found.");
      if (status === "cancelled") {
        const slot = this.db.slots.find((s) => s.id === appointment.slot_id);
        if (slot && slot.status === "booked") slot.status = "open";
      }
      appointment.status = status;
      appointment.updated_at = new Date().toISOString();
      return this.detail(appointment);
    });
  }

  async findAppointmentByReference(reference: string) {
    return this.read(() => {
      const appointment = this.db.appointments.find(
        (a) => a.reference.toUpperCase() === reference.trim().toUpperCase(),
      );
      return appointment ? this.detail(appointment) : null;
    });
  }

  async listAppointments(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    return this.read(() =>
      this.db.appointments
        .filter((a) => a.doctor_id === doctorId)
        .map((a) => this.detail(a))
        .filter((a) => a.slot.start_at >= fromISO && a.slot.start_at < toISO)
        .sort((a, b) => a.slot.start_at.localeCompare(b.slot.start_at)),
    );
  }

  async createFeedback(input: {
    doctorId: ID;
    appointmentId: ID | null;
    patientName: string;
    rating: number;
    comment: string;
  }) {
    return this.transaction(() => {
      const feedback: Feedback = {
        id: randomUUID(),
        doctor_id: input.doctorId,
        appointment_id: input.appointmentId,
        patient_name: input.patientName.trim(),
        rating: input.rating,
        comment: input.comment.trim(),
        status: "pending",
        created_at: new Date().toISOString(),
        published_at: null,
      };
      this.db.feedback.push(feedback);
      return feedback;
    });
  }

  async listFeedback(doctorId: ID, status?: FeedbackStatus) {
    return this.read(() =>
      this.db.feedback
        .filter((f) => f.doctor_id === doctorId && (!status || f.status === status))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );
  }

  async updateFeedbackStatus(doctorId: ID, feedbackId: ID, status: FeedbackStatus) {
    return this.transaction(() => {
      const feedback = this.db.feedback.find((f) => f.id === feedbackId && f.doctor_id === doctorId);
      if (!feedback) throw new BookingError("NOT_FOUND", "Feedback not found.");
      feedback.status = status;
      feedback.published_at = status === "published" ? new Date().toISOString() : null;
      return feedback;
    });
  }

  async enqueueNotifications(
    jobs: Omit<NotificationJob, "id" | "created_at" | "attempts" | "last_error" | "sent_at">[],
  ) {
    await this.transaction(() => {
      for (const job of jobs) {
        this.db.notifications.push({
          ...job,
          id: randomUUID(),
          attempts: 0,
          last_error: null,
          sent_at: null,
          created_at: new Date().toISOString(),
        });
      }
    });
  }

  async dueNotifications(nowISO: ISODate, limit: number) {
    return this.read(() =>
      this.db.notifications
        .filter((n) => n.status === "pending" && n.send_at <= nowISO)
        .sort((a, b) => a.send_at.localeCompare(b.send_at))
        .slice(0, limit),
    );
  }

  async markNotification(id: ID, status: NotificationStatus, error?: string | null) {
    await this.transaction(() => {
      const job = this.db.notifications.find((n) => n.id === id);
      if (!job) return;
      job.status = status;
      job.attempts += 1;
      job.last_error = error ?? null;
      job.sent_at = status === "sent" ? new Date().toISOString() : null;
    });
  }

  async cancelPendingNotifications(appointmentId: ID, kinds?: NotificationKind[]) {
    await this.transaction(() => {
      for (const job of this.db.notifications) {
        if (job.appointment_id !== appointmentId) continue;
        if (job.status !== "pending") continue;
        if (kinds && !kinds.includes(job.kind)) continue;
        job.status = "skipped";
      }
    });
  }
}
