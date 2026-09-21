/**
 * PostgreSQL driver (Supabase / Neon / any managed Postgres).
 *
 * Every booking mutation runs inside a transaction and takes a row-level lock
 * on the slot (SELECT ... FOR UPDATE), so two patients racing for the same slot
 * serialise instead of double-booking. A partial unique index on appointments
 * backs this up at the schema level.
 *
 * Apply the schema once with: npm run db:setup
 */
import { Pool, type PoolClient } from "pg";

import { BookingError } from "./errors";
import { SCHEMA_SQL } from "./schema";
import { DEFAULT_DOCTOR, DEFAULT_RULES, newReference } from "./seed";
import type {
  Appointment,
  AppointmentDetail,
  AppointmentStatus,
  AvailabilityBlock,
  AvailabilityRule,
  BookSlotInput,
  ConsultMode,
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
} from "./types";

type Row = Record<string, unknown>;

const iso = (value: unknown): string => (value instanceof Date ? value.toISOString() : String(value));
const isoOrNull = (value: unknown): string | null =>
  value == null ? null : value instanceof Date ? value.toISOString() : String(value);

function mapSlot(r: Row): Slot {
  return {
    id: r.id as string,
    doctor_id: r.doctor_id as string,
    start_at: iso(r.start_at),
    end_at: iso(r.end_at),
    status: r.status as Slot["status"],
    modes: r.modes as ConsultMode[],
    created_at: iso(r.created_at),
  };
}

function mapPatient(r: Row): Patient {
  return {
    id: r.id as string,
    doctor_id: (r.doctor_id as string) ?? null,
    full_name: r.full_name as string,
    phone: r.phone as string,
    email: r.email as string,
    auth_user_id: (r.auth_user_id as string) ?? null,
    consent_at: isoOrNull(r.consent_at),
    created_at: iso(r.created_at),
    updated_at: iso(r.updated_at),
  };
}

function mapAppointment(r: Row): Appointment {
  return {
    id: r.id as string,
    reference: r.reference as string,
    doctor_id: r.doctor_id as string,
    slot_id: r.slot_id as string,
    patient_id: r.patient_id as string,
    patient_name: r.patient_name as string,
    patient_phone: r.patient_phone as string,
    patient_email: r.patient_email as string,
    mode: r.mode as ConsultMode,
    status: r.status as AppointmentStatus,
    reason: (r.reason as string) ?? null,
    consent_at: iso(r.consent_at),
    created_at: iso(r.created_at),
    updated_at: iso(r.updated_at),
  };
}

/** Joined rows come back prefixed (s_*, p_*) so one query fills an AppointmentDetail. */
const DETAIL_SELECT = `
  a.*,
  s.id as s_id, s.doctor_id as s_doctor_id, s.start_at as s_start_at, s.end_at as s_end_at,
  s.status as s_status, s.modes as s_modes, s.created_at as s_created_at,
  p.id as p_id, p.doctor_id as p_doctor_id, p.full_name as p_full_name, p.phone as p_phone,
  p.email as p_email, p.auth_user_id as p_auth_user_id, p.consent_at as p_consent_at,
  p.created_at as p_created_at, p.updated_at as p_updated_at
`;

function mapDetail(r: Row): AppointmentDetail {
  const slot = mapSlot({
    id: r.s_id,
    doctor_id: r.s_doctor_id,
    start_at: r.s_start_at,
    end_at: r.s_end_at,
    status: r.s_status,
    modes: r.s_modes,
    created_at: r.s_created_at,
  });
  const patient = mapPatient({
    id: r.p_id,
    doctor_id: r.p_doctor_id,
    full_name: r.p_full_name,
    phone: r.p_phone,
    email: r.p_email,
    auth_user_id: r.p_auth_user_id,
    consent_at: r.p_consent_at,
    created_at: r.p_created_at,
    updated_at: r.p_updated_at,
  });
  return { ...mapAppointment(r), slot, patient };
}

export class PostgresStore implements Store {
  readonly kind = "postgres" as const;
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: Number(process.env.PGPOOL_MAX ?? 5),
      ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? undefined : { rejectUnauthorized: false },
    });
  }

  private async tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await fn(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Creates the tables, or brings an older database up to date.
   *
   * Cheap to call: the two checks below cost one query, and the schema is only
   * applied when something is actually missing — so an already-current database
   * pays nothing on a cold start. The advisory lock serialises instances that
   * boot at the same moment, since applying DDL twice at once is not safe even
   * when each statement is idempotent on its own.
   */
  private async ensureSchema(c: PoolClient) {
    const { rows } = await c.query(`
      select to_regclass('public.appointments') is not null as installed,
             exists (
               select 1 from information_schema.columns
                where table_schema = 'public'
                  and table_name = 'appointments'
                  and column_name = 'patient_name'
             ) as current
    `);
    if (rows[0].installed && rows[0].current) return;

    await c.query("select pg_advisory_xact_lock(hashtext('theskinedit:schema'))");
    await c.query(SCHEMA_SQL);
  }

  async init() {
    await this.tx(async (c) => {
      await this.ensureSchema(c);
      const { rows } = await c.query("select id from doctors where slug = $1", [DEFAULT_DOCTOR.slug]);
      let doctorId = rows[0]?.id as string | undefined;
      if (!doctorId) {
        const inserted = await c.query(
          `insert into doctors (id, slug, full_name, title, email, phone, timezone)
           values ($1,$2,$3,$4,$5,$6,$7) returning id`,
          [
            DEFAULT_DOCTOR.id,
            DEFAULT_DOCTOR.slug,
            DEFAULT_DOCTOR.full_name,
            DEFAULT_DOCTOR.title,
            DEFAULT_DOCTOR.email,
            DEFAULT_DOCTOR.phone,
            DEFAULT_DOCTOR.timezone,
          ],
        );
        doctorId = inserted.rows[0].id as string;
      }
      const rules = await c.query("select count(*)::int as n from availability_rules where doctor_id = $1", [doctorId]);
      if (rules.rows[0].n === 0) {
        for (const rule of DEFAULT_RULES) {
          await c.query(
            `insert into availability_rules (doctor_id, weekday, start_time, end_time, slot_minutes, modes, active)
             values ($1,$2,$3,$4,$5,$6,$7)`,
            [doctorId, rule.weekday, rule.start_time, rule.end_time, rule.slot_minutes, rule.modes, rule.active],
          );
        }
      }
    });
  }

  async getDoctor(slug: string) {
    const { rows } = await this.pool.query("select * from doctors where slug = $1", [slug]);
    return rows[0] ? ({ ...rows[0], created_at: iso(rows[0].created_at) } as Doctor) : null;
  }

  async listDoctors() {
    const { rows } = await this.pool.query("select * from doctors order by full_name");
    return rows.map((r) => ({ ...r, created_at: iso(r.created_at) }) as Doctor);
  }

  async listAvailabilityRules(doctorId: ID) {
    const { rows } = await this.pool.query(
      "select * from availability_rules where doctor_id = $1 order by weekday, start_time",
      [doctorId],
    );
    return rows as AvailabilityRule[];
  }

  async replaceAvailabilityRules(doctorId: ID, rules: Omit<AvailabilityRule, "id" | "doctor_id">[]) {
    return this.tx(async (c) => {
      await c.query("delete from availability_rules where doctor_id = $1", [doctorId]);
      const created: AvailabilityRule[] = [];
      for (const rule of rules) {
        const { rows } = await c.query(
          `insert into availability_rules (doctor_id, weekday, start_time, end_time, slot_minutes, modes, active)
           values ($1,$2,$3,$4,$5,$6,$7) returning *`,
          [doctorId, rule.weekday, rule.start_time, rule.end_time, rule.slot_minutes, rule.modes, rule.active],
        );
        created.push(rows[0] as AvailabilityRule);
      }
      return created;
    });
  }

  async listBlocks(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    const { rows } = await this.pool.query(
      `select * from availability_blocks
       where doctor_id = $1 and end_at > $2 and start_at < $3 order by start_at`,
      [doctorId, fromISO, toISO],
    );
    return rows.map((r) => ({
      ...r,
      start_at: iso(r.start_at),
      end_at: iso(r.end_at),
      created_at: iso(r.created_at),
    })) as AvailabilityBlock[];
  }

  async createBlock(doctorId: ID, startISO: ISODate, endISO: ISODate, reason: string | null) {
    const { rows } = await this.pool.query(
      `insert into availability_blocks (doctor_id, start_at, end_at, reason) values ($1,$2,$3,$4) returning *`,
      [doctorId, startISO, endISO, reason],
    );
    const r = rows[0];
    return { ...r, start_at: iso(r.start_at), end_at: iso(r.end_at), created_at: iso(r.created_at) } as AvailabilityBlock;
  }

  async deleteBlock(doctorId: ID, blockId: ID) {
    await this.pool.query("delete from availability_blocks where id = $1 and doctor_id = $2", [blockId, doctorId]);
  }

  async listSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    const { rows } = await this.pool.query(
      "select * from slots where doctor_id = $1 and start_at >= $2 and start_at < $3 order by start_at",
      [doctorId, fromISO, toISO],
    );
    return rows.map(mapSlot);
  }

  async insertSlotsIgnoringConflicts(slots: Slot[]) {
    if (slots.length === 0) return 0;
    return this.tx(async (c) => {
      let inserted = 0;
      for (const slot of slots) {
        const { rowCount } = await c.query(
          `insert into slots (doctor_id, start_at, end_at, status, modes)
           values ($1,$2,$3,$4,$5) on conflict (doctor_id, start_at) do nothing`,
          [slot.doctor_id, slot.start_at, slot.end_at, slot.status, slot.modes],
        );
        inserted += rowCount ?? 0;
      }
      return inserted;
    });
  }

  async blockOpenSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    return this.tx(async (c) => {
      const conflicts = await c.query(
        `select id from slots
         where doctor_id = $1 and start_at < $3 and end_at > $2 and status = 'booked'`,
        [doctorId, fromISO, toISO],
      );
      const updated = await c.query(
        `update slots set status = 'blocked'
         where doctor_id = $1 and start_at < $3 and end_at > $2 and status = 'open'`,
        [doctorId, fromISO, toISO],
      );
      return { blocked: updated.rowCount ?? 0, conflicts: conflicts.rows.map((r) => r.id as string) };
    });
  }

  async unblockSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    const { rowCount } = await this.pool.query(
      `update slots set status = 'open'
       where doctor_id = $1 and start_at < $3 and end_at > $2 and status = 'blocked'`,
      [doctorId, fromISO, toISO],
    );
    return rowCount ?? 0;
  }

  async deleteOpenSlots(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    const { rowCount } = await this.pool.query(
      `delete from slots s
       where s.doctor_id = $1 and s.start_at >= $2 and s.start_at < $3 and s.status <> 'booked'
         and not exists (select 1 from appointments a where a.slot_id = s.id)`,
      [doctorId, fromISO, toISO],
    );
    return rowCount ?? 0;
  }

  /**
   * Finds the person, or records a new one.
   *
   * Matched on phone *and* name, because a phone number identifies a household
   * rather than a person: a mother and her son booking from the same number are
   * two patients. Only the matched person's contact details are refreshed.
   */
  private async upsertPatient(c: PoolClient, doctorId: ID, input: BookSlotInput["patient"]) {
    const fullName = input.fullName.trim();
    const phone = input.phone.trim();
    const email = input.email.trim().toLowerCase();

    const { rows: found } = await c.query(
      `update patients
          set email = $3, consent_at = now(), updated_at = now()
        where phone = $1 and lower(full_name) = lower($2)
       returning *`,
      [phone, fullName, email],
    );
    if (found[0]) return mapPatient(found[0]);

    const { rows } = await c.query(
      `insert into patients (doctor_id, full_name, phone, email, consent_at)
       values ($1,$2,$3,$4, now()) returning *`,
      [doctorId, fullName, phone, email],
    );
    return mapPatient(rows[0]);
  }

  private async detailById(c: PoolClient | Pool, appointmentId: ID) {
    const { rows } = await c.query(
      `select ${DETAIL_SELECT} from appointments a
       join slots s on s.id = a.slot_id
       join patients p on p.id = a.patient_id
       where a.id = $1`,
      [appointmentId],
    );
    return rows[0] ? mapDetail(rows[0]) : null;
  }

  async bookSlot(input: BookSlotInput) {
    return this.tx(async (c) => {
      // Row-level lock: concurrent bookers queue here rather than both winning.
      const { rows } = await c.query(
        "select * from slots where id = $1 and doctor_id = $2 for update",
        [input.slotId, input.doctorId],
      );
      const slot = rows[0] ? mapSlot(rows[0]) : null;
      if (!slot) throw new BookingError("SLOT_NOT_FOUND", "That slot no longer exists.");
      if (slot.status !== "open") throw new BookingError("SLOT_TAKEN", "That slot has just been taken.");
      if (new Date(slot.start_at).getTime() < Date.now()) {
        throw new BookingError("SLOT_PAST", "That slot is in the past.");
      }
      if (!slot.modes.includes(input.mode)) {
        throw new BookingError("MODE_UNAVAILABLE", "That consultation type is not offered in this slot.");
      }

      const patient = await this.upsertPatient(c, input.doctorId, input.patient);
      await c.query("update slots set status = 'booked' where id = $1", [slot.id]);

      let appointmentId: string | null = null;
      for (let attempt = 0; attempt < 5 && !appointmentId; attempt += 1) {
        try {
          const created = await c.query(
            `insert into appointments
               (reference, doctor_id, slot_id, patient_id,
                patient_name, patient_phone, patient_email, mode, reason, consent_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9, now()) returning id`,
            [
              newReference(),
              input.doctorId,
              slot.id,
              patient.id,
              patient.full_name,
              patient.phone,
              patient.email,
              input.mode,
              input.reason?.trim() || null,
            ],
          );
          appointmentId = created.rows[0].id as string;
        } catch (error) {
          const code = (error as { code?: string }).code;
          if (code !== "23505") throw error; // only retry on reference collision
        }
      }
      if (!appointmentId) throw new BookingError("REFERENCE_COLLISION", "Could not allocate a booking reference.");

      return (await this.detailById(c, appointmentId))!;
    });
  }

  async rescheduleAppointment(appointmentId: ID, newSlotId: ID, mode?: ConsultMode) {
    return this.tx(async (c) => {
      const appointmentRows = await c.query("select * from appointments where id = $1 for update", [appointmentId]);
      const appointment = appointmentRows.rows[0] ? mapAppointment(appointmentRows.rows[0]) : null;
      if (!appointment) throw new BookingError("NOT_FOUND", "Appointment not found.");
      if (appointment.status !== "confirmed") {
        throw new BookingError("NOT_ACTIVE", "Only a confirmed appointment can be moved.");
      }

      // Lock both slots in a stable order to avoid deadlocks between two reschedules.
      const ids = [appointment.slot_id, newSlotId].sort();
      const locked = await c.query("select * from slots where id = any($1::uuid[]) order by id for update", [ids]);
      const target = locked.rows.map(mapSlot).find((s) => s.id === newSlotId);
      if (!target || target.doctor_id !== appointment.doctor_id) {
        throw new BookingError("SLOT_NOT_FOUND", "That slot no longer exists.");
      }
      if (target.status !== "open") throw new BookingError("SLOT_TAKEN", "That slot has just been taken.");
      const nextMode = mode ?? appointment.mode;
      if (!target.modes.includes(nextMode)) {
        throw new BookingError("MODE_UNAVAILABLE", "That consultation type is not offered in this slot.");
      }

      await c.query("update slots set status = 'open' where id = $1 and status = 'booked'", [appointment.slot_id]);
      await c.query("update slots set status = 'booked' where id = $1", [target.id]);
      await c.query("update appointments set slot_id = $1, mode = $2, updated_at = now() where id = $3", [
        target.id,
        nextMode,
        appointmentId,
      ]);
      return (await this.detailById(c, appointmentId))!;
    });
  }

  async cancelAppointment(appointmentId: ID) {
    return this.tx(async (c) => {
      const rows = await c.query("select * from appointments where id = $1 for update", [appointmentId]);
      const appointment = rows.rows[0] ? mapAppointment(rows.rows[0]) : null;
      if (!appointment) throw new BookingError("NOT_FOUND", "Appointment not found.");
      if (appointment.status !== "cancelled") {
        await c.query("update slots set status = 'open' where id = $1 and status = 'booked'", [appointment.slot_id]);
        await c.query("update appointments set status = 'cancelled', updated_at = now() where id = $1", [appointmentId]);
      }
      return (await this.detailById(c, appointmentId))!;
    });
  }

  async updateAppointmentStatus(doctorId: ID, appointmentId: ID, status: AppointmentStatus) {
    return this.tx(async (c) => {
      const rows = await c.query("select * from appointments where id = $1 and doctor_id = $2 for update", [
        appointmentId,
        doctorId,
      ]);
      const appointment = rows.rows[0] ? mapAppointment(rows.rows[0]) : null;
      if (!appointment) throw new BookingError("NOT_FOUND", "Appointment not found.");
      if (status === "cancelled") {
        await c.query("update slots set status = 'open' where id = $1 and status = 'booked'", [appointment.slot_id]);
      }
      await c.query("update appointments set status = $1, updated_at = now() where id = $2", [status, appointmentId]);
      return (await this.detailById(c, appointmentId))!;
    });
  }

  async findAppointmentByReference(reference: string) {
    const { rows } = await this.pool.query(
      `select ${DETAIL_SELECT} from appointments a
       join slots s on s.id = a.slot_id
       join patients p on p.id = a.patient_id
       where upper(a.reference) = upper($1)`,
      [reference.trim()],
    );
    return rows[0] ? mapDetail(rows[0]) : null;
  }

  async listAppointments(doctorId: ID, fromISO: ISODate, toISO: ISODate) {
    const { rows } = await this.pool.query(
      `select ${DETAIL_SELECT} from appointments a
       join slots s on s.id = a.slot_id
       join patients p on p.id = a.patient_id
       where a.doctor_id = $1 and s.start_at >= $2 and s.start_at < $3
       order by s.start_at`,
      [doctorId, fromISO, toISO],
    );
    return rows.map(mapDetail);
  }

  async createFeedback(input: {
    doctorId: ID;
    appointmentId: ID | null;
    patientName: string;
    rating: number;
    comment: string;
  }) {
    const { rows } = await this.pool.query(
      `insert into feedback (doctor_id, appointment_id, patient_name, rating, comment)
       values ($1,$2,$3,$4,$5) returning *`,
      [input.doctorId, input.appointmentId, input.patientName.trim(), input.rating, input.comment.trim()],
    );
    const r = rows[0];
    return { ...r, created_at: iso(r.created_at), published_at: isoOrNull(r.published_at) } as Feedback;
  }

  async listFeedback(doctorId: ID, status?: FeedbackStatus) {
    const { rows } = await this.pool.query(
      status
        ? "select * from feedback where doctor_id = $1 and status = $2 order by created_at desc"
        : "select * from feedback where doctor_id = $1 order by created_at desc",
      status ? [doctorId, status] : [doctorId],
    );
    return rows.map((r) => ({
      ...r,
      created_at: iso(r.created_at),
      published_at: isoOrNull(r.published_at),
    })) as Feedback[];
  }

  async updateFeedbackStatus(doctorId: ID, feedbackId: ID, status: FeedbackStatus) {
    const { rows } = await this.pool.query(
      `update feedback set status = $1, published_at = case when $1 = 'published' then now() else null end
       where id = $2 and doctor_id = $3 returning *`,
      [status, feedbackId, doctorId],
    );
    if (!rows[0]) throw new BookingError("NOT_FOUND", "Feedback not found.");
    return { ...rows[0], created_at: iso(rows[0].created_at), published_at: isoOrNull(rows[0].published_at) } as Feedback;
  }

  async enqueueNotifications(
    jobs: Omit<NotificationJob, "id" | "created_at" | "attempts" | "last_error" | "sent_at">[],
  ) {
    for (const job of jobs) {
      await this.pool.query(
        `insert into notifications (appointment_id, kind, channel, send_at, status) values ($1,$2,$3,$4,$5)`,
        [job.appointment_id, job.kind, job.channel, job.send_at, job.status],
      );
    }
  }

  async dueNotifications(nowISO: ISODate, limit: number) {
    const { rows } = await this.pool.query(
      `select * from notifications where status = 'pending' and send_at <= $1 order by send_at limit $2`,
      [nowISO, limit],
    );
    return rows.map((r) => ({
      ...r,
      send_at: iso(r.send_at),
      sent_at: isoOrNull(r.sent_at),
      created_at: iso(r.created_at),
    })) as NotificationJob[];
  }

  async markNotification(id: ID, status: NotificationStatus, error?: string | null) {
    await this.pool.query(
      `update notifications
       set status = $1, attempts = attempts + 1, last_error = $2,
           sent_at = case when $1 = 'sent' then now() else null end
       where id = $3`,
      [status, error ?? null, id],
    );
  }

  async cancelPendingNotifications(appointmentId: ID, kinds?: NotificationKind[]) {
    if (kinds && kinds.length > 0) {
      await this.pool.query(
        `update notifications set status = 'skipped'
         where appointment_id = $1 and status = 'pending' and kind = any($2::text[])`,
        [appointmentId, kinds],
      );
      return;
    }
    await this.pool.query(
      `update notifications set status = 'skipped' where appointment_id = $1 and status = 'pending'`,
      [appointmentId],
    );
  }
}
