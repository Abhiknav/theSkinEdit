/**
 * Domain types shared by every storage driver.
 *
 * Every entity carries doctor_id from day one — multi-doctor support is adding
 * rows, never restructuring tables.
 */

export type ID = string;
export type ISODate = string;

export type ConsultMode = "clinic" | "online";
export type SlotStatus = "open" | "booked" | "blocked";
export type AppointmentStatus = "confirmed" | "cancelled" | "completed" | "no_show";
export type FeedbackStatus = "pending" | "published" | "hidden";
export type NotificationKind = "confirmation" | "reschedule" | "cancellation" | "reminder_24h" | "feedback_request";
export type NotificationChannel = "email" | "whatsapp";
export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

export interface Doctor {
  id: ID;
  slug: string;
  full_name: string;
  title: string;
  email: string;
  phone: string;
  timezone: string;
  created_at: ISODate;
}

export interface Patient {
  id: ID;
  doctor_id: ID | null;
  full_name: string;
  phone: string;
  email: string;
  /** Reserved for the later "patient account" phase — adding login writes here. */
  auth_user_id: string | null;
  consent_at: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface AvailabilityRule {
  id: ID;
  doctor_id: ID;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  /** "13:30" — clinic-local wall time */
  start_time: string;
  end_time: string;
  slot_minutes: number;
  modes: ConsultMode[];
  active: boolean;
}

export interface AvailabilityBlock {
  id: ID;
  doctor_id: ID;
  start_at: ISODate;
  end_at: ISODate;
  reason: string | null;
  created_at: ISODate;
}

export interface Slot {
  id: ID;
  doctor_id: ID;
  start_at: ISODate;
  end_at: ISODate;
  status: SlotStatus;
  modes: ConsultMode[];
  created_at: ISODate;
}

export interface Appointment {
  id: ID;
  reference: string;
  doctor_id: ID;
  slot_id: ID;
  patient_id: ID;
  mode: ConsultMode;
  status: AppointmentStatus;
  /** Free-text reason for visit. Deliberately NOT clinical notes — see DPDP note in README. */
  reason: string | null;
  consent_at: ISODate;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface AppointmentDetail extends Appointment {
  slot: Slot;
  patient: Patient;
}

export interface Feedback {
  id: ID;
  doctor_id: ID;
  appointment_id: ID | null;
  patient_name: string;
  rating: number;
  comment: string;
  status: FeedbackStatus;
  created_at: ISODate;
  published_at: ISODate | null;
}

export interface NotificationJob {
  id: ID;
  appointment_id: ID;
  kind: NotificationKind;
  channel: NotificationChannel;
  send_at: ISODate;
  status: NotificationStatus;
  attempts: number;
  last_error: string | null;
  sent_at: ISODate | null;
  created_at: ISODate;
}

export interface BookSlotInput {
  doctorId: ID;
  slotId: ID;
  mode: ConsultMode;
  patient: { fullName: string; phone: string; email: string };
  reason?: string | null;
  consent: true;
}

export interface RescheduleInput {
  reference: string;
  phone: string;
  newSlotId: ID;
  mode?: ConsultMode;
}

/**
 * Storage contract. The Postgres driver implements these with real transactions
 * and SELECT ... FOR UPDATE; the file driver implements them under a process mutex.
 * Business logic in src/server/booking never talks to a database directly.
 */
export interface Store {
  readonly kind: "postgres" | "file";
  init(): Promise<void>;

  getDoctor(slug: string): Promise<Doctor | null>;
  listDoctors(): Promise<Doctor[]>;

  listAvailabilityRules(doctorId: ID): Promise<AvailabilityRule[]>;
  replaceAvailabilityRules(
    doctorId: ID,
    rules: Omit<AvailabilityRule, "id" | "doctor_id">[],
  ): Promise<AvailabilityRule[]>;

  listBlocks(doctorId: ID, fromISO: ISODate, toISO: ISODate): Promise<AvailabilityBlock[]>;
  createBlock(doctorId: ID, startISO: ISODate, endISO: ISODate, reason: string | null): Promise<AvailabilityBlock>;
  deleteBlock(doctorId: ID, blockId: ID): Promise<void>;

  listSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate): Promise<Slot[]>;
  insertSlotsIgnoringConflicts(slots: Slot[]): Promise<number>;
  /** Blocks open slots inside a window; returns ids of slots that were booked and could not be blocked. */
  blockOpenSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate): Promise<{ blocked: number; conflicts: ID[] }>;
  unblockSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate): Promise<number>;
  /** Removes unbooked slots so they can be regenerated after the rules change. */
  deleteOpenSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate): Promise<number>;

  bookSlot(input: BookSlotInput): Promise<AppointmentDetail>;
  rescheduleAppointment(appointmentId: ID, newSlotId: ID, mode?: ConsultMode): Promise<AppointmentDetail>;
  cancelAppointment(appointmentId: ID): Promise<AppointmentDetail>;
  updateAppointmentStatus(doctorId: ID, appointmentId: ID, status: AppointmentStatus): Promise<AppointmentDetail>;

  findAppointmentByReference(reference: string): Promise<AppointmentDetail | null>;
  listAppointments(doctorId: ID, fromISO: ISODate, toISO: ISODate): Promise<AppointmentDetail[]>;

  createFeedback(input: {
    doctorId: ID;
    appointmentId: ID | null;
    patientName: string;
    rating: number;
    comment: string;
  }): Promise<Feedback>;
  listFeedback(doctorId: ID, status?: FeedbackStatus): Promise<Feedback[]>;
  updateFeedbackStatus(doctorId: ID, feedbackId: ID, status: FeedbackStatus): Promise<Feedback>;

  enqueueNotifications(jobs: Omit<NotificationJob, "id" | "created_at" | "attempts" | "last_error" | "sent_at">[]): Promise<void>;
  dueNotifications(nowISO: ISODate, limit: number): Promise<NotificationJob[]>;
  markNotification(id: ID, status: NotificationStatus, error?: string | null): Promise<void>;
  cancelPendingNotifications(appointmentId: ID, kinds?: NotificationKind[]): Promise<void>;
}
