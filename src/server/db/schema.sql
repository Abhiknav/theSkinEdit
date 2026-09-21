-- The Skin Edit — PostgreSQL schema (Supabase / Neon compatible)
-- Applied automatically on first boot when DATABASE_URL is set.

create extension if not exists "pgcrypto";

create table if not exists doctors (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  full_name   text not null,
  title       text not null default '',
  email       text not null,
  phone       text not null default '',
  timezone    text not null default 'Asia/Kolkata',
  created_at  timestamptz not null default now()
);

create table if not exists patients (
  id           uuid primary key default gen_random_uuid(),
  doctor_id    uuid references doctors(id) on delete set null,
  full_name    text not null,
  -- Not unique. Households share a number, and two people on one phone are two
  -- patients, not one record that each booking overwrites.
  phone        text not null,
  email        text not null,
  -- Reserved for the later patient-login phase; adding auth writes here only.
  auth_user_id text unique,
  consent_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists availability_rules (
  id           uuid primary key default gen_random_uuid(),
  doctor_id    uuid not null references doctors(id) on delete cascade,
  weekday      smallint not null check (weekday between 0 and 6),
  start_time   text not null,
  end_time     text not null,
  slot_minutes smallint not null default 20,
  modes        text[] not null default array['clinic','online'],
  active       boolean not null default true
);
create index if not exists availability_rules_doctor_idx on availability_rules (doctor_id, weekday);

create table if not exists availability_blocks (
  id         uuid primary key default gen_random_uuid(),
  doctor_id  uuid not null references doctors(id) on delete cascade,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  reason     text,
  created_at timestamptz not null default now()
);
create index if not exists availability_blocks_doctor_idx on availability_blocks (doctor_id, start_at);

-- Slots are materialised rows, never computed on the fly. This is what makes
-- locking (and therefore multi-doctor scale) safe.
create table if not exists slots (
  id         uuid primary key default gen_random_uuid(),
  doctor_id  uuid not null references doctors(id) on delete cascade,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  status     text not null default 'open' check (status in ('open','booked','blocked')),
  modes      text[] not null default array['clinic','online'],
  created_at timestamptz not null default now(),
  unique (doctor_id, start_at)
);
create index if not exists slots_lookup_idx on slots (doctor_id, start_at, status);

create table if not exists appointments (
  id         uuid primary key default gen_random_uuid(),
  reference  text unique not null,
  doctor_id  uuid not null references doctors(id) on delete cascade,
  slot_id    uuid not null references slots(id),
  patient_id uuid not null references patients(id),
  -- The details exactly as given at booking. An appointment is a historical
  -- record: it must not change later because the same person booked again with
  -- a different spelling, or because someone else booked from the same phone.
  patient_name  text not null,
  patient_phone text not null,
  patient_email text not null,
  mode       text not null check (mode in ('clinic','online')),
  status     text not null default 'confirmed'
             check (status in ('confirmed','cancelled','completed','no_show')),
  -- Reason for visit only. No clinical notes are stored here (DPDP Act 2023).
  reason     text,
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists appointments_doctor_idx on appointments (doctor_id, status);
create index if not exists patients_phone_idx on patients (phone);
-- One live appointment per slot, enforced by the database rather than by hope.
create unique index if not exists appointments_active_slot_idx
  on appointments (slot_id) where status in ('confirmed','completed','no_show');

create table if not exists feedback (
  id             uuid primary key default gen_random_uuid(),
  doctor_id      uuid not null references doctors(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  patient_name   text not null,
  rating         smallint not null check (rating between 1 and 5),
  comment        text not null,
  status         text not null default 'pending' check (status in ('pending','published','hidden')),
  created_at     timestamptz not null default now(),
  published_at   timestamptz
);
create index if not exists feedback_doctor_idx on feedback (doctor_id, status);

create table if not exists notifications (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  kind           text not null,
  channel        text not null check (channel in ('email','whatsapp')),
  send_at        timestamptz not null,
  status         text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  attempts       int not null default 0,
  last_error     text,
  sent_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists notifications_due_idx on notifications (status, send_at);

-- ---------------------------------------------------------------------------
-- Migrations
--
-- Everything above is CREATE ... IF NOT EXISTS, so it does nothing to a
-- database that already has these tables. These statements bring such a
-- database up to the shape above, and are no-ops on a fresh one. Re-running
-- the whole file is safe either way.
-- ---------------------------------------------------------------------------

-- An appointment used to read the patient's name and email through a join, so
-- a later booking from the same phone silently rewrote the older appointment.
-- Give every appointment its own copy, backfilled from the linked patient.
alter table appointments add column if not exists patient_name  text;
alter table appointments add column if not exists patient_phone text;
alter table appointments add column if not exists patient_email text;

update appointments a
   set patient_name  = coalesce(a.patient_name,  p.full_name),
       patient_phone = coalesce(a.patient_phone, p.phone),
       patient_email = coalesce(a.patient_email, p.email)
  from patients p
 where p.id = a.patient_id
   and (a.patient_name is null or a.patient_phone is null or a.patient_email is null);

alter table appointments alter column patient_name  set not null;
alter table appointments alter column patient_phone set not null;
alter table appointments alter column patient_email set not null;

-- Two people may share a phone number.
alter table patients drop constraint if exists patients_phone_key;
